
const querySchema = z.object({
  order: z.enum(["asc", "desc"]).default("asc"),
  orderBy: z.enum(["_id", "from", "to", "symbol", "timestamp", "message", "value"]).default("timestamp"),
  offset: z.coerce.number().int().default(0),
  limit: z.coerce.number().int().default(10),
});

export default eventHandler(async (event) => {
  const { currencySymbol } = useRuntimeConfig();
  const _id = await getUserId(event);
  const query = getQuery(event);
  const validated = await zodValidateData(
    query,
    querySchema.parse
  );

  const user = await ModelUser.findById(_id);
  if (!user) {
    throw createError({ message: "User not found", status: 404 });
  }
  const transactions = process.env.VITEST === "true" ? [] : await getTransactions({
    address: user.address,
    symbol: currencySymbol,
    ...validated
  });

  return transactions;
});
