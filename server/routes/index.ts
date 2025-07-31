import { Wallet } from "ethers";

export default eventHandler(async (event) => {
  const _id = await getUserId(event);
  const userExist = await ModelUser.findOne({
    _id,
  });
  if (userExist === null) {
    throw createError({ message: "User not exists!", status: 409 });
  }

  const wallet = await ModelWallet.findOne({
    userId: userExist._id,
  });

  const walletAddress = wallet?.privateKey
    ? new Wallet(wallet.privateKey).address
    : undefined;
  return {
    ...userExist.toObject({ flattenMaps: true }),
    publicKey: walletAddress,
  }
});
