
const sendNotification = async (base: string, content: string, receiver: number) => {
  await $fetch("/private/message", {
    retry: 5,
    retryDelay: 1000,
    baseURL: base,
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: { content, receiver }
  });
};

export default sendNotification;
