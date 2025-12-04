import { EventHandlerRequest, H3Event } from "h3";

const MONTH = 1000 * 60 * 60 * 24 * 30;
const MINUTES_15 = 1000 * 60 * 15;

const useTokens = async (
	event: H3Event<EventHandlerRequest>,
	fingerprint: string,
	currentRefreshToken?: string,
) => {
	const { secret } = useRuntimeConfig();
	const currentTokenModel = currentRefreshToken
		? await ModelToken.findOne({
				token: currentRefreshToken,
			})
		: null;
	const canRefresh =
		!!currentTokenModel &&
		Date.now() <= currentTokenModel.expiresIn.getTime() &&
		currentTokenModel.fingerprint === fingerprint;

	const ipAddress = getRequestIP(event, { xForwardedFor: true });

	const requestNewTokens = async ({
		userId,
		os,
		source,
		application,
		role = "user",
		id,
		switchInfo,
	}: {
		userId: string;
		os: "windows" | "linux" | "macos" | "android" | "ios" | "web";
		source: string;
		application: string;
		role?: string;
		id?: string;
		switchInfo?: {
			id: string;
			index: number;
			length: number;
		};
	}) => {
		const refreshToken = issueRefreshToken();
		const timestamp = Date.now();
		const expiresRefreshToken = new Date(timestamp + MONTH);
		const expiresAccessToken = new Date(timestamp + MINUTES_15);
		const initialId = id || userId;
		const accessToken = issueAccessToken(
			{
				userId,
				role,
				id: initialId,
				switchInfoId: switchInfo?.id,
				switchInfoIndex: switchInfo?.index,
				switchInfoLength: switchInfo?.length,
			},
			{ secret },
		);

		if (currentTokenModel) {
			await currentTokenModel.deleteOne();
		}

		const refreshTokenDocument = new ModelToken({
			userId,
			token: refreshToken,
			timestamp,
			id: initialId,
			role,
			os,
			source,
			application,
			ipAddress,
			fingerprint,
			expiresIn: expiresRefreshToken,
			switchInfoId: switchInfo?.id,
			switchInfoIndex: switchInfo?.index,
			switchInfoLength: switchInfo?.length,
		});
		await refreshTokenDocument.save();

		setCookie(event, "refreshToken", refreshToken, {
			expires: expiresRefreshToken,
			sameSite: "none",
			secure: true,
		});

		setCookie(event, "accessToken", accessToken, {
			expires: expiresAccessToken,
			sameSite: "none",
			secure: true,
		});

		return {
			refreshToken,
			accessToken,
			timestamp,
			refreshTokenDocument,
			expiresAccessToken,
			expiresRefreshToken,
		};
	};

	const removeTokens = async () => {
		if (currentTokenModel) {
			await currentTokenModel.deleteOne();
		}

		deleteCookie(event, "refreshToken");
		deleteCookie(event, "accessToken");
	};

	return { currentTokenModel, canRefresh, requestNewTokens, removeTokens };
};

export default useTokens;
