import { Wallet } from "ethers";

const requestBodySchema = z.object({
  queryId: z.string().optional(),
  user: z.string().optional(),
  authDate: z.number(),
  signature: z.string(),
  hash: z.string(),
  canSendAfter: z.number().optional(),
  chat: z.string().optional(),
  chatType: z
    .enum(["sender", "private", "group", "supergroup", "channel"])
    .optional(),
  chatInstance: z.string().optional(),
  receiver: z.string().optional(),
  startParam: z.string().optional(),
});

export default eventHandler(async (event) => {
  const { botToken } = useRuntimeConfig();
  const validated = await zodValidateBody(event, requestBodySchema.parse);
  const valid = isValidTelegramHash(validated, botToken, true);

  const { user, receiver, authDate, hash } = validated;
  if (!user && !receiver) {
    throw createError({
      message: "Either 'user' or 'receiver' must be provided.",
      status: 400,
    });
  }
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
    const role = userSaved.role || "user";
    const { save } = useTokens({
      event,
      userId,
      role,
    });
    save();

    const walletRecord = await createWallet(userSaved._id);

    if (walletRecord === null) {
      throw createError({
        message: "Failed to create wallet for the user.",
        status: 500,
      });
    }

    const walletAddress = new Wallet(walletRecord.privateKey).address;
    return {
      ...userSaved.toObject({ flattenMaps: true }),
      publicKey: walletAddress,
    };
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
  const modelRecord = await ModelUser.findOne({ _id });
  const walletRecord = await ModelWallet.findOne({ userId: modelRecord._id });
  const walletAddress = walletRecord
    ? new Wallet(walletRecord.privateKey).address
    : undefined;
  return {
    ...modelRecord.toObject({ flattenMaps: true }),
    publicKey: walletAddress,
  };
});
