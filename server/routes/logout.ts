export default eventHandler(async (event) => {
	const userId = await getUserId(event);
	const userExist = await ModelUser.findOne({ _id: userId });

	if (userExist !== null) {
		const { deleteByUserId } = useTokens({ event, userId });
		await deleteByUserId();
	}

	deleteCookie(event, "refreshToken");
	deleteCookie(event, "accessToken");

	return { message: "User logged out successfully" };
});
