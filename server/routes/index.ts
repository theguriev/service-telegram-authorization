export default eventHandler(async (event) => {
  const _id = await getUserId(event);
  const userExist = await ModelUser.findOne({
    _id,
  });
  if (userExist === null) {
    throw createError({ message: "User not exists!", status: 409 });
  }
  const wallet = new Wallet(userExist.privateKey);
  return {
    address: wallet.address,
    ...userExist.toObject(),
  };
});
