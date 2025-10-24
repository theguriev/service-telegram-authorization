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
  try {
    const { botToken } = useRuntimeConfig();
    const { id, authDate, firstName, hash, lastName, photoUrl, username } =
      await zodValidateBody(event, requestBodySchema.parse);
    console.log("log: trying to login via login ", {
      id,
      authDate,
      firstName,
      lastName,
      photoUrl,
      username,
    });

    const valid = isValidTelegramHash(
      { id, firstName, lastName, username, photoUrl, authDate, hash },
      botToken
    );
    console.log("log: 1 ");
    if (!valid) {
      throw createError({ message: "Invalid user hash!", status: 403 });
    }
    console.log("log: 2 ");
    const userRecord = await ModelUser.findOne({ id });
    console.log("log: 3 ");
    if (userRecord === null) {
      console.log("log: 4 ");
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
        permissions: [],
        featureFlags: ["ffMealsV2"],
        meta: {},
      });
      const userSaved = await userDocument.save();
      console.log("log: 4 --");
      const userId = userSaved._id.toString();
      const role = userSaved.role || "user";
      const { save } = useTokens({
        event,
        userId,
        role,
      });
      save();

      return userDocument;
    }
    const _id = userRecord._id.toString();
    const role = userRecord.role || "user";
    console.log("log: 5 ");
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
    // const { save } = useTokens({
    //   event,
    //   userId: _id,
    //   role,
    //   id: _id,
    // });
    // console.log("log: 6 ");
    // save();
    console.log("log: 7 ");
    return ModelUser.findOne({ _id });
  } catch (error) {
    console.error("Error occurred during login:", error);
    throw createError({ message: "Internal Server Error", status: 500 });
  }
});
