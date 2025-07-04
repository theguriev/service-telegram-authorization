export default defineTask({
  meta: {
    name: "wallet:daily-spend",
    description: "Daily wallet funding",
  },
  async run() {
    const wallets = await ModelWallet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $match: {
          "user.role": { $ne: "admin" },
        },
      },
    ]);
    for (const { privateKey, userId } of wallets) {
      try {
        const balance = await getBalance(privateKey);
        const user = await ModelUser.findById(userId);
        const managerWalletRecord = await ModelWallet.findOne({
          userId: user.meta["managerId"],
        });
        if (managerWalletRecord && balance) {
          await sendTransaction(
            privateKey,
            managerWalletRecord.privateKey,
            1,
            JSON.stringify({
              from: user.id,
              to: user.meta["managerId"],
            })
          );
        }
      } catch (error) {
        console.error(`Error processing wallet for user ${userId}:`, error);
      }
    }
    return { result: "Success" };
  },
});
