const querySchema = z.object({
  order: z.enum(["asc", "desc"]).default("asc"),
  orderBy: z.enum(["_id", "from", "to", "symbol", "timestamp", "message", "value"]).default("timestamp"),
  offset: z.coerce.number().int().default(0),
  limit: z.coerce.number().int().default(10),
});

const userIdSchema = z.string().nonempty();

export default eventHandler(async (event) => {
  const { currencySymbol } = useRuntimeConfig();
  const _id = await getId(event);
  const query = getQuery(event);
  const validated = await zodValidateData(
    query,
    querySchema.parse
  );

  const user = await ModelUser.findOne({
    _id,
  });
  if (user === null) {
    throw createError({ message: "User not exists", status: 409 });
  }

  const ownerId = getRouterParam(event, 'uid');
  const validatedOwnerId = await zodValidateData(
    ownerId,
    userIdSchema.parse
  );
  const owner = await ModelUser.findById(validatedOwnerId);
  if (!owner) {
    throw createError({ message: "Transactions owner not found", status: 404 });
  }
  if (owner.meta?.get("managerId") !== user.id && user.role !== "admin") {
    throw createError({ message: "You are not authorized to access this resource", status: 403 });
  }

  const transactions = process.env.VITEST === "true" ? [] : await getTransactions(owner.address, currencySymbol, validated);

  return transactions;
});
