const requestBodySchema = z.object({
	id: z.number(),
	firstName: z.string(),
	lastName: z.string().nullish(),
	username: z.string().nullish(),
	photoUrl: z.string().nullish(),
	authDate: z.number(),
	hash: z.string(),
	os: z.enum(["windows", "linux", "macos", "android", "ios", "web"]),
	application: z.string(),
	fingerprint: z.string(),
	source: z.string(),
	refreshToken: z.string().optional(),
});

export default eventHandler(async (event) => {
	const { botToken } = useRuntimeConfig();
	const {
		id,
		authDate,
		firstName,
		hash,
		lastName,
		photoUrl,
		username,
		fingerprint,
		source,
		application,
		os,
	} = await zodValidateBody(event, requestBodySchema.parse);
	const currentRefreshToken = await getRefreshToken(event);
	const valid = isValidTelegramHash(
		{ id, firstName, lastName, username, photoUrl, authDate, hash },
		botToken,
	);

	if (!valid) {
		throw createError({ message: "Invalid user hash!", status: 403 });
	}
	const userRecord = await ModelUser.findOne({ id });
	if (userRecord === null) {
		const wallet = Wallet.createRandom();
		const userDocument = new ModelUser({
			id,
			authDate,
			firstName,
			hash,
			lastName,
			photoUrl,
			username,
			privateKey: wallet.privateKey,
			address: wallet.address,
			permissions: [],
			featureFlags: ["ffMealsV2"],
			meta: {},
		});
		const userSaved = await userDocument.save();
		const userId = userSaved._id.toString();
		const role = userSaved.role || "user";
		const { requestNewTokens } = await useTokens(
			event,
			fingerprint,
			currentRefreshToken,
		);

		const { accessToken, refreshToken } = await requestNewTokens({
			userId,
			os,
			application,
			source,
			role,
		});

		return {
			accessToken,
			refreshToken,
			user: userDocument,
		};
	}
	const _id = userRecord._id.toString();
	const role = userRecord.role || "user";
	await ModelUser.updateOne(
		{
			_id,
		},
		{
			$set: {
				id,
				authDate,
				firstName,
				hash,
				lastName,
				photoUrl,
				username,
			},
		},
	);
	const { requestNewTokens } = await useTokens(
		event,
		fingerprint,
		currentRefreshToken,
	);

	const { accessToken, refreshToken } = await requestNewTokens({
		userId: _id,
		os,
		application,
		source,
		role,
	});

	return {
		accessToken,
		refreshToken,
		user: await ModelUser.findOne({ _id }),
	};
});
