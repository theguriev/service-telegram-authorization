import { Wallet } from "ethers";

export default eventHandler(async (event) => {
  const oldRefreshToken = getCookie(event, "refreshToken");
  const oldRefreshTokenDocument = await ModelToken.findOne({
    token: oldRefreshToken,
  });
  if (oldRefreshTokenDocument === null) {
    throw createError({ message: "Refresh token not found!", status: 404 });
  }
  const userId = oldRefreshTokenDocument.userId!;
  const user = await ModelUser.findOne({ _id: userId });
  if (user === null) {
    throw createError({ message: "User not found!", status: 404 });
  }

  const { save, deleteByUserId } = useTokens({
    event,
    userId,
    role: oldRefreshTokenDocument.role,
    id: oldRefreshTokenDocument.id,
  });
  await deleteByUserId();
  await save();

  const wallet = await ModelWallet.findOne({
    userId: user._id,
  });

  const walletAddress = wallet?.privateKey
    ? new Wallet(wallet.privateKey).address
    : undefined;

  return {
    ...user.toObject({ flattenMaps: true }),
    publicKey: walletAddress,
  };
});
