const requestBodySchema = z.object({
	fingerprint: z.string(),
	refreshToken: z.string().optional(),
});

export default eventHandler(async (event) => {
	const { fingerprint } = await zodValidateBody(event, requestBodySchema.parse);
	const refreshToken = await getRefreshToken(event);

	const { removeTokens } = await useTokens(event, fingerprint, refreshToken);

	await removeTokens();

	return { message: "User logged out successfully" };
});
