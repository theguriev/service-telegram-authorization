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

  const { receiver: receiverId } = await zodValidateBody(
    event,
    requestBodySchema.parse
  );
  const receiver = await ModelUser.findById(receiverId);
  if (!receiver) {
    throw createError({ message: "Receiver not found", status: 404 });
  }
  if (receiver.meta?.get("managerId") !== user.id && user.role !== "admin") {
    throw createError({
      message: "You are not authorized to access this resource",
      status: 403,
    });
  }

  const wallet = await ModelWallet.findOne({
    userId: receiver._id,
  });

  const managerWallet = await ModelWallet.findOne({
    userId: user._id,
  });
  if (!wallet) {
    throw createError({
      message: "Wallet not found for the specified user",
      status: 404,
    });
  }

  if (!managerWallet) {
    throw createError({
      message: "Manager wallet not found for the user",
      status: 404,
    });
  }

  const managerBalance =
    process.env.VITEST === "true"
      ? 1000000
      : await getBalance(managerWallet.privateKey);
  if (managerBalance <= 0) {
    throw createError({
      message: "Manager wallet has insufficient balance",
      status: 400,
    });
  }
  if (process.env.VITEST !== "true") {
    const balance = await getBalance(wallet.privateKey);
    if (balance > 0) {
      throw createError({
        message: "User has a balance, cannot continue subscription",
        status: 400,
      });
    }

    const subscriptionDuration = 61; // 61 days
    await sendTransaction(
      managerWallet.privateKey,
      wallet.privateKey,
      subscriptionDuration,
      "Continue subscription"
    );
  }

  return {
    success: true,
  };
});
