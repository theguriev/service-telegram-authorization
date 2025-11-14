export default eventHandler(async (event) => {
	const { currencySymbol } = useRuntimeConfig();
	const _id = await getUserId(event);

	const user = await ModelUser.findById(_id);
	if (!user) {
		throw createError({ message: "User not found", status: 404 });
	}
	const balance =
		process.env.VITEST === "true"
			? 0
			: await getBalance(user.address, currencySymbol);

	return { balance };
});
