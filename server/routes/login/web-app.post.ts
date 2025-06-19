const requestBodySchema = z.object({
  queryId: z.string().optional(),
  user: z.string().optional(),
  authDate: z.number(),
  signature: z.string(),
  hash: z.string(),
  canSendAfter: z.number().optional(),
  chat: z.string().optional(),
  chatType: z.enum(["sender", "private", "group", "supergroup", "channel"]).optional(),
  chatInstance: z.string().optional(),
  receiver: z.string().optional(),
  startParam: z.string().optional(),
});

export default eventHandler(async (event) => {
  const { botToken } = useRuntimeConfig();
  const validated = await zodValidateBody(
    event,
    requestBodySchema.parse
  );
  const valid = isValidTelegramHash(
    validated,
    botToken,
    true
  );

  const { user, receiver, authDate, hash } = validated;
  const {
    id,
    first_name: firstName,
    last_name: lastName,
    username,
    photo_url: photoUrl,
  } = destr<{
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    language_code: string;
    allows_write_to_pm: boolean;
    photo_url: string;
  }>(user ?? receiver);

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
  const { save } = useTokens({
    event,
    userId: _id,
  });
  save();
  return await ModelUser.findOne({ _id });
});
