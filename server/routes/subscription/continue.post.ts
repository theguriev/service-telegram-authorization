
const requestBodySchema = z.object({
  receiver: z.string(),
});

export default eventHandler(async (event) => {
  const _id = await getId(event);
  const user = await ModelUser.findOne({
    _id,
  });
  if (user === null) {
    throw createError({ message: "User not exists", status: 409 });
  }


  const { receiver: receiverId } = await zodValidateBody(event, requestBodySchema.parse);
  const receiver = await ModelUser.findById(receiverId);
  if (!receiver) {
    throw createError({ message: "Receiver not found", status: 404 });
  }
  if (receiver.meta?.get("managerId") !== user.id && user.role !== "admin") {
    throw createError({ message: "You are not authorized to access this resource", status: 403 });
  }

  const wallet = await ModelWallet.findOne({
    userId: receiver._id,
  });
  if (!wallet) {
    throw createError({ message: "Wallet not found for the specified user", status: 404 });
  }

  const { walletPrivateKey } = useRuntimeConfig();
  if (process.env.VITEST !== "true") {
    const balance = await getBalance(wallet.privateKey);
    if (balance > 0) {
      throw createError({ message: "User has a balance, cannot continue subscription", status: 400 });
    }

    await sendTransaction(walletPrivateKey, wallet.privateKey, 61, "Continue subscription");
  }

  return {
    success: true,
  };
});
