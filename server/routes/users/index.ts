export default defineEventHandler(async (event) => {
  const { currencySymbol } = useRuntimeConfig();
  const validated = await zodValidateData(getQuery(event), usersRequestSchema.parse);
  const userId = await getUserId(event);
  return getUsers(currencySymbol, userId, event, validated);
});
