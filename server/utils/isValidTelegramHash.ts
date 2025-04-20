const isValidTelegramHash = (
  data?: Record<string, string | number>,
  token?: string,
  webApp?: boolean
) => {
  if (!data || !token) {
    return false;
  }

  const checkHash = generateTelegramHash(data, token, webApp);
  return checkHash === data.hash;
};

export default isValidTelegramHash;
