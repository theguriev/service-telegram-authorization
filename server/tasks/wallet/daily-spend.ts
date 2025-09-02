import { addHours, startOfDay } from "date-fns";

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
          user: {
            $elemMatch: matchCan("daily-spend"),
          },
        },
      },
    ]);

    const retrieveStartDate = (date: Date) => addHours(startOfDay(date), date.getHours() >= 21 ? 21 : -3);
    for (const { privateKey, userId } of wallets) {
      try {
        const balance = await getBalance(privateKey);
        const user = await ModelUser.findById(userId);
        const manager = await ModelUser.findOne({
          id: user.meta?.get("managerId"),
        });
        if (!manager) {
          console.warn(`Manager not found for user ${userId}`);
          continue;
        }

        const managerWalletRecord = await ModelWallet.findOne({
          userId: manager._id,
        });

        const userWallet = new Wallet(privateKey);
        const transactions = await getAllTransactions(privateKey, {
          order: "asc",
        });
        const calculatedBalance = calculateCurrentBalance(
          userWallet.address,
          transactions,
          retrieveStartDate
        );
        const valueToSend = Math.max(0, balance - calculatedBalance);

        if (managerWalletRecord && balance && valueToSend) {
          await sendTransaction(
            privateKey,
            managerWalletRecord.privateKey,
            valueToSend,
            JSON.stringify({
              from: user.id,
              to: user.meta?.get("managerId"),
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
