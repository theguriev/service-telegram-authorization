const requestBodySchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  photoUrl: z.string(),
  authDate: z.number(),
  hash: z.string(),
});

export default eventHandler(async (event) => {
  const { botToken } = useRuntimeConfig();
  const { id, authDate, firstName, hash, lastName, photoUrl, username } =
    await zodValidateBody(event, requestBodySchema.parse);

  const valid = isValidTelegramHash(
    { id, firstName, lastName, username, photoUrl, authDate, hash },
    botToken
  );

  if (!valid) {
    throw createError({ message: "Invalid user hash!", status: 403 });
  }
  const userRecord = await ModelUser.findOne({ id });
  if (userRecord === null) {
    const userDocument = new ModelUser({
      id,
      authDate,
      firstName,
      hash,
      lastName,
      photoUrl,
      username,
      timestamp: Date.now(),
      meta: {},
    });
    const userSaved = await userDocument.save();
    const userId = userSaved._id.toString();
    const { save } = useTokens({
      event,
      userId,
    });
    save();
    return userDocument;
  }
  const _id = userRecord._id.toString();
  await ModelUser.updateOne(
    {
      _id,
    },
    {
      $set: {
        id,
        authDate,
        firstName,
        hash,
        lastName,
        photoUrl,
        username,
      },
    }
  );
  return await ModelUser.findOne({ _id });
});
