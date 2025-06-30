import { Types } from "mongoose";

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
  if (user.role !== "admin") {
    throw createError({ message: "You are not authorized to access this resource", status: 403 });
  }

  const { receiver } = await zodValidateBody(event, requestBodySchema.parse);
  const wallet = await ModelWallet.findOne({
    userId: new Types.ObjectId(receiver),
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
