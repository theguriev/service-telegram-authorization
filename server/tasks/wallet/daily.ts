import plural from "plural-ru";
import { md } from "telegram-escape";

export default defineTask({
  meta: {
    name: "wallet:daily",
    description: "Daily wallet funding and subscription reminders",
  },
  async run() {
    const { walletPrivateKey, notificationBase } = useRuntimeConfig();
    const wallets = await ModelWallet.find({});
    for (const { privateKey, userId } of wallets) {
      try {
        const balance = await getBalance(privateKey);
        if (balance) {
          await sendTransaction(privateKey, walletPrivateKey, 1, 'Daily funding');

          if ([7, 5, 3, 1].includes(balance - 1)) {
            const user = await ModelUser.findById(userId);
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
            const days = plural(balance - 1, "%d день", "%d дні", "%d днів");
            const message = `Шановний ${name} нагадуємо вам, що ваша підписка на програму наука та здоровий глузд, закінчується через ${days}. Для того аби не зупинятися, та змінювати життя на краще, просимо звʼязатися із наставником для продовження підписки. Гарного дня та успіхів!`
            await sendNotification(notificationBase, md`*Підписка* \- ${message}`, user.id);
          }
        }
      } catch (error) {
        console.error(`Error processing wallet for user ${userId}:`, error);
      }
    }
    return { result: "Success" };
  },
});
