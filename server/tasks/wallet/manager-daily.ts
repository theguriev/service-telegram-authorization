import type { InferSchemaType, Types } from 'mongoose';
import { md } from "telegram-escape";

export default defineTask({
  meta: {
    name: "wallet:manager-daily",
    description: "Daily task to notify managers about users with expiring subscriptions",
  },
  async run() {
    const { notificationBase } = useRuntimeConfig();
    const result = await ModelUser.aggregate([
      {
        $match: {
          'meta.managerId': { $exists: true, $ne: null },
          ...matchCan("manager-daily"),
        },
      },
      {
        $lookup: {
          from: 'wallets',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'wallets',
        },
      },
      {
        $match: {
          wallets: { $size: 1 },
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

    for (const { managerId, users } of result) {
      const usersWithBalancesAsync = users.map(async (user:
        InferSchemaType<typeof schemaUser> &
        {
          _id: Types.ObjectId,
          wallets: InferSchemaType<typeof schemaWallet>[]
        }
      ) => {
        try {
          return {
            user,
            balance: await getBalance(user.wallets[0].privateKey)
          };
        } catch (error) {
          console.error(`Error getting balance for user ${user._id}:`, error);
        }
      });
      const usersWithBalances = await Promise.all(usersWithBalancesAsync);
      const message = md`Користувачі, у яких закінчується підписка:`;

      const userLinks = usersWithBalances
        .filter((user) => user && user.balance <= 7)
        .map(({ user, balance }) => {
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
