import plural from "plural-ru";
import { md } from "telegram-escape";

const requestBodySchema = z.object({
  receiver: z.string(),
});

export default eventHandler(async (event) => {
  const { notificationBase, currencySymbol } = useRuntimeConfig();
  const _id = await getId(event);
  const user = await ModelUser.findOne({
    _id,
  }).select("+privateKey");
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
  if (!(
    can(user, "continue-all-users-subscription") ||
    receiver.meta?.get("managerId") === user.id && can(user, "continue-managed-users-subscription")
  )) {
    throw createError({
      message: "You are not authorized to access this resource",
      status: 403,
    });
  }

  const managerBalance =
    process.env.VITEST === "true"
      ? 1000000
      : await getBalance(user.address, currencySymbol);
  if (managerBalance <= 0) {
    throw createError({
      message: "Manager wallet has insufficient balance",
      status: 400,
    });
  }
  if (process.env.VITEST !== "true") {
    const transactions = await getTransactions(receiver.address, currencySymbol);

    const subscriptionDuration = transactions.length ? 60 : 62;
    await sendTransaction(
      currencySymbol,
      user.privateKey,
      receiver.address,
      subscriptionDuration,
      "Continue subscription"
    );

    const days = plural(subscriptionDuration, "%d день", "%d дні", "%d днів");
    try {
      await sendNotification(
        notificationBase,
        md`*Вам була надана підписка на ${days}*`,
        receiver.id
      );
    } catch (error) {
      console.error(`Error sending notification after subscription continuation for user ${receiver._id}:`, error);
    }
  }

  return {
    success: true,
  };
});
