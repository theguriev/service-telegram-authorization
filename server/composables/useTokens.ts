import type { EventHandlerRequest, H3Event } from "h3";
import type { HydratedDocument, InferSchemaType } from "mongoose";

import type schemaUser from "~/db/schema/user";

const MONTH = 1000 * 60 * 60 * 24 * 30;
const MINUTES_15 = 1000 * 60 * 15;

type UserDocument = HydratedDocument<InferSchemaType<typeof schemaUser>>;

const toIsoString = (value?: Date | string) =>
	value instanceof Date ? value.toISOString() : value;

const useTokens = ({
	event,
	userId,
	role = "user",
	id,
	switchInfo,
	user,
	permissions,
	featureFlags,
	createdAt,
}: {
	event: H3Event<EventHandlerRequest>;
	userId: string;
	role?: string;
	id?: string;
	switchInfo?: {
		id: string;
		index: number;
		length: number;
	};
	user?: UserDocument | null;
	permissions?: string[];
	featureFlags?: string[];
	createdAt?: Date | string;
}) => {
	const refreshToken = issueRefreshToken();
	const { secret } = useRuntimeConfig();
	const timestamp = Date.now();
	const expiresRefreshToken = new Date(timestamp + MONTH);
	const expiresAccessToken = new Date(timestamp + MINUTES_15);
	const initialId = id || userId;
	const accessToken = issueAccessToken(
		{
			userId,
			role,
			id: initialId,
			permissions: permissions ?? user?.permissions ?? [],
			featureFlags: featureFlags ?? user?.featureFlags ?? [],
			createdAt: createdAt ?? toIsoString(user?.createdAt),
			switchInfoId: switchInfo?.id,
			switchInfoIndex: switchInfo?.index,
			switchInfoLength: switchInfo?.length,
		},
		{ secret },
	);

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

	const save = async () => {
		const refreshTokenDocument = new ModelToken({
			userId,
			token: refreshToken,
			timestamp,
			id,
			role,
			switchInfoId: switchInfo?.id,
			switchInfoIndex: switchInfo?.index,
			switchInfoLength: switchInfo?.length,
		});
		return await refreshTokenDocument.save();
	};

	const deleteByUserId = async () => {
		const refreshTokenDocument = new ModelToken();
		return await refreshTokenDocument.collection.deleteMany({
			userId: initialId,
		});
	};
	return { refreshToken, accessToken, timestamp, save, deleteByUserId };
};

export default useTokens;
