import { addHours, startOfDay } from "date-fns";

export default defineTask({
  meta: {
    name: "wallet:daily-spend",
    description: "Daily wallet funding",
  },
  async run() {
    const { currencySymbol } = useRuntimeConfig();
    const users = await ModelUser.aggregate([
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
    ]);

    const retrieveStartDate = (date: Date) => addHours(startOfDay(date), date.getHours() >= 21 ? 21 : -3);
    const balances = await getBalance(users.map(user => user.address), currencySymbol);
    for (const { _id, id, address, privateKey, managers, meta } of users) {
      try {
        const balance = balances[address];
        const manager = managers[0];
        if (!manager) {
          console.warn(`Manager not found for user ${_id}`);
          continue;
        }

        const transactions = await getAllTransactions(address, currencySymbol, {
          order: "asc",
        });
        const calculatedBalance = calculateCurrentBalance(
          address,
          transactions,
          retrieveStartDate
        );
        const valueToSend = Math.max(0, balance - calculatedBalance);

        if (balance && valueToSend) {
          await sendTransaction(
            currencySymbol,
            privateKey,
            manager.privateKey,
            valueToSend,
            JSON.stringify({
              from: id,
              to: meta?.get("managerId"),
            })
          );
        }
      } catch (error) {
        console.error(`Error processing wallet for user ${_id}:`, error);
      }
    }
    return { result: "Success" };
  },
});
