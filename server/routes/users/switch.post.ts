import { Wallet } from "ethers";

const requestBodySchema = z.object({
  id: z.string(),
});

export default eventHandler(async (event) => {
  const { id: userId } = await zodValidateBody(event, requestBodySchema.parse);
  const initialId = await getId(event);
  if (!initialId) {
    throw createError({ message: "Unauthorized", status: 401 });
  }

  const admin = await ModelUser.findById(initialId);
  if (!admin || admin.role !== "admin") {
    throw createError({ message: "Forbidden: Not an admin", status: 403 });
  }

  if (!userId) {
    throw createError({ message: "userId is required", status: 400 });
  }

  const user = await ModelUser.findById(userId);
  if (!user) {
    throw createError({ message: "User not found", status: 404 });
  }

  const wallet = await ModelWallet.findOne({ userId: user._id });
  const walletAddress = wallet
    ? new Wallet(wallet.privateKey).address
    : undefined;

  const { save, deleteByUserId } = useTokens({
    event,
    userId,
    id: initialId,
    role: "admin",
  });
  await deleteByUserId();
  await save();

  return {
    ...user.toObject({ flattenMaps: true }),
    publicKey: walletAddress,
  };
});
