import getSwitchInfo from "~/utils/getSwitchInfo";
import getSwitchInfoIndex from "~/utils/getSwitchInfoIndex";

const requestBodySchema = z.object({
	os: z.enum(["windows", "linux", "macos", "android", "ios", "web"]),
	application: z.string(),
	fingerprint: z.string(),
	source: z.string(),
	refreshToken: z.string().optional(),
});

export default eventHandler(async (event) => {
	const { fingerprint, source, application, os } = await zodValidateBody(
		event,
		requestBodySchema.parse,
	);
	const currentRefreshToken = await getRefreshToken(event);
	const { requestNewTokens, canRefresh, removeTokens } = await useTokens(
		event,
		fingerprint,
		currentRefreshToken,
	);

	if (!canRefresh) {
		await removeTokens();
		throw createError({
			message: "Forbidden: can't refresh tokens",
			status: 403,
		});
	}

	const userId = await getUserId(event);
	const initialId = await getId(event);
	if (!initialId) {
		throw createError({ message: "Unauthorized", status: 401 });
	}

	const manager = await ModelUser.findById(initialId);
	if (!manager) {
		throw createError({ message: "Initial user not found", status: 404 });
	}

	if (!can(manager, "switch-previous-user")) {
		throw createError({
			message: "Forbidden: can't switch previous user",
			status: 403,
		});
	}

	if (!userId) {
		throw createError({ message: "userId is required", status: 400 });
	}

	const user = await ModelUser.findById(userId);
	if (!user) {
		throw createError({ message: "User not found", status: 404 });
	}

	const switchInfo = await getSwitchInfo(event);
	if (!switchInfo) {
		throw createError({ message: "Switch info not found", status: 404 });
	}

	const currentUserIndex = await getSwitchInfoIndex(event);
	if (currentUserIndex === undefined) {
		throw createError({ message: "User not found in switch", status: 404 });
	}
	if (currentUserIndex === 0) {
		throw createError({ message: "No previous user", status: 400 });
	}

	const previousUserId =
		currentUserIndex === 1 ? initialId : switchInfo.users[currentUserIndex - 2];
	const previousUser = await ModelUser.findById(previousUserId);
	if (!previousUser) {
		throw createError({ message: "Previous user not found", status: 404 });
	}

	const { accessToken, refreshToken } = await requestNewTokens({
		os,
		source,
		application,
		userId: previousUserId,
		id: initialId,
		role: manager.role || "user",
		switchInfo: {
			id: switchInfo._id.toString(),
			index: currentUserIndex - 1,
			length: switchInfo.users.length + 2,
		},
	});

	return {
		accessToken,
		refreshToken,
		status: previousUserId === initialId ? "return" : "success",
		user: previousUser,
		usersRequest: switchInfo.usersRequest,
	};
});
