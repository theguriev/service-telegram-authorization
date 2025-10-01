import getSwitchInfo from "~/utils/getSwitchInfo";
import getSwitchInfoIndex from "~/utils/getSwitchInfoIndex";

export default eventHandler(async (event) => {
  const userId = await getUserId(event);
  const initialId = await getId(event);
  if (!initialId) {
    throw createError({ message: "Unauthorized", status: 401 });
  }

  const manager = await ModelUser.findById(initialId);
  if (!manager) {
    throw createError({ message: "Initial user not found", status: 404 });
  }

  if (!can(manager, "switch-next-user")) {
    throw createError({ message: "Forbidden: can't switch next user", status: 403 });
  }

  if (!userId) {
    throw createError({ message: "userId is required", status: 400 });
  }

  const user = await ModelUser.findById(userId);
  if (!user) {
    throw createError({ message: "User not found", status: 404 });
  }

  const switchInfo = await getSwitchInfo(event);
  if (!switchInfo) {
    throw createError({ message: "Switch info not found", status: 404 });
  }

  const currentUserIndex = await getSwitchInfoIndex(event);
  if (currentUserIndex === undefined) {
    throw createError({ message: "User not found in switch", status: 404 });
  }
  if (currentUserIndex === switchInfo.users.length + 1) {
    throw createError({ message: "Already at the last user", status: 400 });
  }

  const nextUserId = currentUserIndex === switchInfo.users.length
    ? initialId
    : switchInfo.users[currentUserIndex];
  const nextUser = await ModelUser.findById(nextUserId);
  if (!nextUser) {
    throw createError({ message: "Next user not found", status: 404 });
  }

  const { save, deleteByUserId } = useTokens({
    event,
    userId: nextUserId,
    id: initialId,
    role: manager.role || "user",
    switchInfo: {
      id: switchInfo._id.toString(),
      index: currentUserIndex + 1,
      length: switchInfo.users.length + 2
    }
  });
  await deleteByUserId();
  await save();

  return {
    status: nextUserId === initialId ? "return" : "success",
    user: nextUser,
    usersRequest: switchInfo.usersRequest
  };
});
