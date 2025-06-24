const requestBodySchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string().nullish(),
  username: z.string().nullish(),
  photoUrl: z.string().nullish(),
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
      meta: {},
    });
    const userSaved = await userDocument.save();
    const userId = userSaved._id.toString();
    const role = userSaved.role || "user";
    const { save } = useTokens({
      event,
      userId,
      role,
    });
    save();

    await createWallet(userSaved._id);

    return userDocument;
  }
  const _id = userRecord._id.toString();
  const role = userRecord.role || "user";
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
  const { save } = useTokens({
    event,
    userId: _id,
    role,
  });
  save();
  return await ModelUser.findOne({ _id });
});
