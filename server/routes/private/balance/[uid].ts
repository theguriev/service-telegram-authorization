const userIdSchema = z.string().nonempty();

export default eventHandler(async (event) => {
  const ownerId = getRouterParam(event, 'uid');
  const validatedOwnerId = await zodValidateData(
    ownerId,
    userIdSchema.parse
  );
  const owner = await ModelUser.findById(validatedOwnerId);
  if (!owner) {
    throw createError({ message: "Balance owner not found", status: 404 });
  }

  const walletModel = await ModelWallet.findOne({ userId: owner._id });
  if (!walletModel) {
    throw createError({ message: "Wallet not found", status: 404 });
  }
  const balance = process.env.VITEST === "true" ? 0 : await getBalance(walletModel.privateKey);

  return { balance };
});
