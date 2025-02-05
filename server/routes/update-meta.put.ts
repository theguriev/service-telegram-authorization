const requestBodySchema = z.object({
  meta: z.record(z.any()),
});

export default eventHandler(async (event) => {
  const _id = await getUserId(event);
  const { meta } = await zodValidateBody(event, requestBodySchema.parse);
  await ModelUser.updateOne(
    {
      _id,
    },
    {
      $set: {
        meta,
      },
    }
  );
  const userExist = await ModelUser.findOne({
    _id,
  });
  if (userExist === null) {
    throw createError({ message: "User not exists!", status: 409 });
  }
  return userExist;
});
