
const sendNotification = async (base: string, content: string, receiverId: number, inlineKeyboard?: { text: string, url: string }[]) => {
  await $fetch("/private/message", {
    retry: 5,
    retryDelay: 1000,
    baseURL: base,
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: { content, receiverId, inlineKeyboard }
  });
};

export default sendNotification;
