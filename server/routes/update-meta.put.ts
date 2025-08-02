const requestBodySchema = z.object({
  meta: z.record(z.any()),
});

export default eventHandler(async (event) => {
  const _id = await getUserId(event);
  const { meta } = await zodValidateBody(event, requestBodySchema.parse);
  const user = await ModelUser.findOne({
    _id,
  });
  if (user === null) {
    throw createError({ message: "User not exists!", status: 409 });
  }

  user.meta = new Map(Object.entries(meta));
  user.save();

  return omit(user.toObject(), ["privateKey"]);
});
