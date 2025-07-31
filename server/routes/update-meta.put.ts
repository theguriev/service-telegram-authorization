import { Wallet } from "ethers";

const requestBodySchema = z.object({
  meta: z.record(z.any()),
});

export default eventHandler(async (event) => {
  const _id = await getUserId(event);
  const { meta } = await zodValidateBody(event, requestBodySchema.parse);
  const user = await ModelUser.findOne({
    _id,
  });
  if (user === null) {
    throw createError({ message: "User not exists!", status: 409 });
  }

  user.meta = new Map(Object.entries(meta));
  await user.save();

  const wallet = await ModelWallet.findOne({
    userId: user._id,
  });

  const walletAddress = wallet?.privateKey
    ? new Wallet(wallet.privateKey).address
    : undefined;

  return {
    ...user.toObject({ flattenMaps: true }),
    publicKey: walletAddress,
  }
});
