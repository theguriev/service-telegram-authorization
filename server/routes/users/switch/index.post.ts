const requestBodySchema = z.object({
  id: z.string(),
  usersRequest: usersRequestSchema.optional()
});

export default eventHandler(async (event) => {
  const { id: userId, usersRequest } = await zodValidateBody(event, requestBodySchema.parse);
  const initialId = await getId(event);
  if (!initialId) {
    throw createError({ message: "Unauthorized", status: 401 });
  }

  const admin = await ModelUser.findById(initialId);
  if (!admin || admin.role !== "admin") {
    throw createError({ message: "Forbidden: Not an admin", status: 403 });
  }

  if (!userId) {
    throw createError({ message: "userId is required", status: 400 });
  }

  const user = await ModelUser.findById(userId);
  if (!user) {
    throw createError({ message: "User not found", status: 404 });
  }

  if (usersRequest && userId !== initialId) {
    const users = await getUsers(initialId, event, usersRequest, false);
    const userIndex = users.findIndex((user) => user._id.toString() === userId);
    if (userIndex === -1) {
      throw createError({ message: "User not found", status: 404 });
    }
    const usersAfterId = users.slice(userIndex);

    const switchInfo = await ModelSwitchInfo.create({
      userId: user._id.toString(),
      users: usersAfterId.map((user) => user._id.toString()),
      usersRequest: new Map(Object.entries(usersRequest))
    });

    const { save, deleteByUserId } = useTokens({
      event,
      userId,
      id: initialId,
      role: "admin",
      switchInfo: {
        id: switchInfo._id.toString(),
        index: 1,
        length: usersAfterId.length + 2
      }
    });
    await deleteByUserId();
    await save();
  } else {
    const { save, deleteByUserId } = useTokens({
      event,
      userId,
      id: initialId,
      role: "admin",
    });
    await deleteByUserId();
    await save();
  }

  return user;
});
