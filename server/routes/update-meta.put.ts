const requestBodySchema = z.object({
  meta: z.record(z.any()),
  userId: z.string().transform(objectIdTransform).optional()
});

export default eventHandler(async (event) => {
  const _id = await getUserId(event);
  const role = await getUserRole(event);
  const { meta, userId } = await zodValidateBody(event, requestBodySchema.parse);
  const user = await ModelUser.findOne({
    _id,
  });
  if (user === null) {
    throw createError({ message: "User not exists!", status: 409 });
  }

  if (userId && role !== "admin" && userId.toString() !== _id) {
    throw createError({ message: "Unauthorized to update target user!", status: 403 });
  }

  if (userId && userId.toString() !== _id) {
    const targetUser = await ModelUser.findOne({
      _id: userId,
    });
    if (targetUser === null) {
      throw createError({ message: "Target user not exists!", status: 409 });
    }

    targetUser.meta = new Map(Object.entries(meta));
    await targetUser.save();

    return targetUser;
  }

  user.meta = new Map(Object.entries(meta));
  await user.save();

  return user;
});
