export default eventHandler(async (event) => {
	const _id = await getUserId(event);
	const user = await ModelUser.findOne({
		_id,
	});
	if (user === null) {
		throw createError({ message: "User not exists!", status: 409 });
	}
	return user;
});
