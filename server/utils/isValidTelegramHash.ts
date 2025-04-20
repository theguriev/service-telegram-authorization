const isValidTelegramHash = (
  data?: Record<string, string | number>,
  token?: string
) => {
  if (!data || !token) {
    return false;
  }

  const checkHash = generateTelegramHash(data, token);
  return checkHash === data.hash;
};

export default isValidTelegramHash;
