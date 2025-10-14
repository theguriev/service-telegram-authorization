const requestBodySchema = z.object({
  meta: z.record(z.any()),
  userId: z.string().transform(objectIdTransform).optional()
});

export default eventHandler(async (event) => {
  const _id = await getUserId(event);
  const managerId = await getId(event);
  const { meta, userId } = await zodValidateBody(event, requestBodySchema.parse);
  const user = await ModelUser.findOne({
    _id: userId ?? _id,
  });
  if (!user) {
    throw createError({ message: "User not exists!", status: 409 });
  }

  const manager = await ModelUser.findById(managerId);
  if (!manager) {
    throw createError({ message: "Manager not exists!", status: 409 });
  }

  if (userId && !(
    userId.toString() === _id ||
    can(manager, "update-all-users-meta") ||
    can(manager, "update-managed-users-meta") && user.meta?.get("managerId") === manager.id
  )) {
    throw createError({ message: "Unauthorized to update target user!", status: 403 });
  }

  user.meta = new Map(Object.entries(meta));
  await user.save();

  return user;
});
