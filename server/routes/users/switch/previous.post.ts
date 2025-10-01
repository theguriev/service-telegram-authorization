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

  if (!can(manager, "switch-previous-user")) {
    throw createError({ message: "Forbidden: can't switch previous user", status: 403 });
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
  if (currentUserIndex === 0) {
    throw createError({ message: "No previous user", status: 400 });
  }

  const previousUserId = currentUserIndex === 1
    ? initialId
    : switchInfo.users[currentUserIndex - 2];
  const previousUser = await ModelUser.findById(previousUserId);
  if (!previousUser) {
    throw createError({ message: "Previous user not found", status: 404 });
  }

  const { save, deleteByUserId } = useTokens({
    event,
    userId: previousUserId,
    id: initialId,
    role: manager.role || "user",
    switchInfo: {
      id: switchInfo._id.toString(),
      index: currentUserIndex - 1,
      length: switchInfo.users.length + 2
    }
  });
  await deleteByUserId();
  await save();

  return {
    status: previousUserId === initialId ? "return" : "success",
    user: previousUser,
    usersRequest: switchInfo.usersRequest
  };
});
