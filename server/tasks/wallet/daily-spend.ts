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
        $match: matchCan("wallet:daily-spend"),
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
      }
    ]);

    const retrieveStartDate = (date: Date) => addHours(startOfDay(date), date.getHours() >= 21 ? 21 : -3);
    const balances = await getBalance(users.map(user => user.address), currencySymbol);
    const transactionsBulk = await getAllTransactionsBulk(users.map(user => user.address), {
      symbol: currencySymbol,
      order: "asc",
      limit: 1000
    });
    for (const { _id, id, address, privateKey, managers } of users) {
      try {
        const balance = balances[address];
        const manager = managers[0];
        if (!manager) {
          console.warn(`Manager not found for user ${_id}`);
          continue;
        }

        const transactions = transactionsBulk.transactions[address];
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
            manager.address,
            valueToSend,
            JSON.stringify({
              from: id,
              to: manager.id,
            }),
            `subscription-daily-${uuidv4()}`
          );
        }
      } catch (error) {
        console.error(`Error processing wallet for user ${_id}:`, error);
      }
    }
    return { result: "Success" };
  },
});
