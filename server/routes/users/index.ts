export default defineEventHandler(async (event) => {
  const validated = await zodValidateData(getQuery(event), usersRequestSchema.parse);
  const userId = await getUserId(event);
  return getUsers(userId, event, validated);
});
