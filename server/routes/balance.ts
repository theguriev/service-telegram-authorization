import { Types } from "mongoose";

export default eventHandler(async (event) => {
  const _id = await getUserId(event);

  const walletModel = await ModelWallet.findOne({ userId: new Types.ObjectId(String(_id)) });
  if (!walletModel) {
    throw createError({ message: "Wallet not found", statusCode: 404 });
  }
  const balance = process.env.VITEST === "true" ? 0 : await getBalance(walletModel.privateKey);

  return { balance };
});
