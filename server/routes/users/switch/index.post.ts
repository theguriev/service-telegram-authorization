const requestBodySchema = z.object({
	id: z.string(),
	usersRequest: usersRequestSchema.optional(),
	os: z.enum(["windows", "linux", "macos", "android", "ios", "web"]),
	application: z.string(),
	fingerprint: z.string(),
	source: z.string(),
	refreshToken: z.string().optional(),
});

export default eventHandler(async (event) => {
	const { currencySymbol } = useRuntimeConfig();
	const {
		id: userId,
		usersRequest,
		fingerprint,
		source,
		application,
		os,
	} = await zodValidateBody(event, requestBodySchema.parse);
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

	const initialId = await getId(event);
	if (!initialId) {
		throw createError({ message: "Unauthorized", status: 401 });
	}

	const manager = await ModelUser.findById(initialId);
	if (!manager) {
		throw createError({ message: "Initial user not found", status: 404 });
	}

	if (!can(manager, "switch-user")) {
		throw createError({ message: "Forbidden: can't switch user", status: 403 });
	}

	if (!userId) {
		throw createError({ message: "userId is required", status: 400 });
	}

	const user = await ModelUser.findById(userId);
	if (!user) {
		throw createError({ message: "User not found", status: 404 });
	}

	if (usersRequest && userId !== initialId) {
		const users = await getUsers(
			currencySymbol,
			initialId,
			event,
			usersRequest,
			false,
		);
		const userIndex = users.findIndex((user) => user._id.toString() === userId);
		if (userIndex === -1) {
			throw createError({ message: "User not found", status: 404 });
		}
		const usersAfterId = users.slice(userIndex);

		const switchInfo = await ModelSwitchInfo.create({
			userId: manager._id.toString(),
			users: usersAfterId.map((user) => user._id.toString()),
			usersRequest: new Map(Object.entries(usersRequest)),
		});

		const { accessToken, refreshToken } = await requestNewTokens({
			os,
			source,
			application,
			userId,
			id: initialId,
			role: manager.role || "user",
			switchInfo: {
				id: switchInfo._id.toString(),
				index: 1,
				length: usersAfterId.length + 2,
			},
		});

		return {
			accessToken,
			refreshToken,
			user,
		};
	} else {
		const { accessToken, refreshToken } = await requestNewTokens({
			os,
			source,
			application,
			userId,
			id: initialId,
			role: manager.role || "user",
		});

		return {
			accessToken,
			refreshToken,
			user,
		};
	}
});
