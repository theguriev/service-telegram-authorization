import type { InferSchemaType, Types } from 'mongoose';
import { md } from "telegram-escape";

export default defineTask({
  meta: {
    name: "wallet:manager-daily",
    description: "Daily task to notify managers about users with expiring subscriptions",
  },
  async run() {
    const { notificationBase, currencySymbol } = useRuntimeConfig();
    const result = await ModelUser.aggregate<{
      users: InferSchemaType<typeof schemaUser>[] & {
        _id: Types.ObjectId;
      },
      managerId: number,
    }>([
      {
        $match: {
          'meta.managerId': { $exists: true, $ne: null },
          ...matchCan("wallet:manager-daily"),
        },
      },
      {
        $group: {
          _id: '$meta.managerId',
          users: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          managerId: '$_id',
          users: 1,
          _id: 0,
        },
      },
    ]);

    const balances = await getBalance(result.flatMap(({ users }) => users.map(user => user.address)), currencySymbol);
    for (const { managerId, users } of result) {
      const message = md`Користувачі, у яких закінчується підписка:`;

      const userLinks = users
        .filter((user) => balances[user.address] <= 7)
        .map((user) => {
          const balance = balances[user.address];
          const name = `${user.firstName} ${user.lastName}`.trim();
          return {
            text: `${name} (залишилось днів: ${balance})`,
            url: `tg://user?id=${user.id}`,
          };
        });

      if (userLinks.length === 0) continue;

      try {
        await sendNotification(notificationBase, message, managerId, userLinks);
      } catch (error) {
        console.error(`Error sending notification to manager ${managerId}:`, error);
      }
    }

    return { result: "Success" };
  },
});
