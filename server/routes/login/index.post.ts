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
    const wallet = Wallet.createRandom();
    const userDocument = new ModelUser({
      id,
      authDate,
      firstName,
      hash,
      lastName,
      photoUrl,
      username,
      privateKey: wallet.privateKey,
      address: wallet.address,
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

    const walletRecord = await ModelWallet.create({
      privateKey: wallet.privateKey,
      userId: userSaved._id,
    });

    if (walletRecord === null) {
      throw createError({
        message: "Failed to create wallet for the user.",
        status: 500,
      });
    }

    return omit(userDocument.toObject(), ["privateKey"]);
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
    id: _id,
  });
  save();
  return omit((await ModelUser.findOne({ _id })).toObject(), ["privateKey"]);
});
