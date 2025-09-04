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
          pipeline: [
            {
              $match: {
                role: { $ne: "admin" },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: "meta.managerId",
                foreignField: "id",
                pipeline: [
                  {
                    $limit: 1
                  }
                ],
                as: 'managers',
              },
            },
            {
              $match: {
                managers: { $ne: [] }
              }
            },
            {
              $limit: 1,
            }
          ],
          as: "users",
        },
      },
      {
        $match: {
          users: { $ne: [] }
        },
      },
    ]);

    const retrieveStartDate = (date: Date) => addHours(startOfDay(date), date.getHours() >= 21 ? 21 : -3);
    for (const { privateKey, userId, users } of wallets) {
      try {
        const balance = await getBalance(privateKey);
        const user = users[0];
        const manager = user.managers[0];
        if (!manager) {
          console.warn(`Manager not found for user ${userId}`);
          continue;
        }

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

        if (balance && valueToSend) {
          await sendTransaction(
            privateKey,
            manager.privateKey,
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
