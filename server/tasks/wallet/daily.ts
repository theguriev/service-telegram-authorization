import plural from "plural-ru";
import { md } from "telegram-escape";

export default defineTask({
  meta: {
    name: "wallet:daily",
    description: "Daily wallet funding",
  },
  async run() {
    const { notificationBase } = useRuntimeConfig();
    const users = await ModelUser.find({
      role: { $ne: "admin" },
    });

    const balances = await getBalance(users.map(user => user.address));
    console.log(balances);
    for (const { _id, id, address, firstName, lastName } of users) {
      try {
        const balance = balances[address];
        if (balance) {
          if ([7, 5, 3, 1].includes(balance - 1)) {
            const name = [firstName, lastName]
              .filter(Boolean)
              .join(" ");
            const days = plural(balance - 1, "%d день", "%d дні", "%d днів");
            const message = `Шановний ${name} нагадуємо вам, що ваша підписка на програму наука та здоровий глузд, закінчується через ${days}. Для того аби не зупинятися, та змінювати життя на краще, просимо звʼязатися із наставником для продовження підписки. Гарного дня та успіхів!`;
            await sendNotification(
              notificationBase,
              md`*Підписка* \- ${message}`,
              id
            );
          }
        }
      } catch (error) {
        console.error(
          `Error processing notification for user ${_id}:`,
          error
        );
      }
    }
    return { result: "Success" };
  },
});
