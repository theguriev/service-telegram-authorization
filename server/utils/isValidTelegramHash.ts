const isValidTelegramHash = (
  data?: InferSchemaType<typeof schemaUser>,
  token?: string
) => {
  if (!data || !token) {
    return false;
  }

  const checkHash = generateTelegramHash(data, token);
  return checkHash === data.hash;
};

export default isValidTelegramHash;
