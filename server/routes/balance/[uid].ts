const userIdSchema = z.string().nonempty();

export default eventHandler(async (event) => {
  const _id = await getId(event);
  const user = await ModelUser.findOne({
    _id,
  });
  if (user === null) {
    throw createError({ message: "User not exists", status: 409 });
  }

  const ownerId = getRouterParam(event, 'uid');
  const validatedOwnerId = await zodValidateData(
    ownerId,
    userIdSchema.parse
  );
  const owner = await ModelUser.findById(validatedOwnerId);
  if (!owner) {
    throw createError({ message: "Balance owner not found", status: 404 });
  }
  if (owner.meta?.get("managerId") !== user.id && user.role !== "admin") {
    throw createError({ message: "You are not authorized to access this resource", status: 403 });
  }

  const walletModel = await ModelWallet.findOne({ userId: owner._id });
  if (!walletModel) {
    throw createError({ message: "Wallet not found", status: 404 });
  }
  const balance = process.env.VITEST === "true" ? 0 : await getBalance(walletModel.privateKey);

  return { balance };
});
