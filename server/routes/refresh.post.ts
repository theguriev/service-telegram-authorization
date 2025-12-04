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
	const { currentTokenModel, requestNewTokens, canRefresh, removeTokens } =
		await useTokens(event, fingerprint, currentRefreshToken);

	if (!canRefresh) {
		await removeTokens();

		throw createError({ message: "Invalid refresh token!", status: 401 });
	}

	const userId = currentTokenModel.userId!;
	const user = await ModelUser.findOne({ _id: userId });
	if (user === null) {
		throw createError({ message: "User not found!", status: 404 });
	}

	const globalUser = await ModelUser.findOne({
		_id: currentTokenModel.id,
	});
	if (globalUser === null) {
		throw createError({ message: "Global user not found!", status: 404 });
	}

	const { accessToken, refreshToken } = await requestNewTokens({
		userId,
		os,
		application,
		source,
		role: globalUser.role || "user",
		id: currentTokenModel.id,
		switchInfo: {
			id: currentTokenModel.switchInfoId,
			index: currentTokenModel.switchInfoIndex,
			length: currentTokenModel.switchInfoLength,
		},
	});

	return {
		accessToken,
		refreshToken,
		user,
	};
});
