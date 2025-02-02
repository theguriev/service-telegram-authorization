import type { H3Event, EventHandlerRequest } from "h3";
const getUserId = async (event: H3Event<EventHandlerRequest>) => {
  const accessToken = String(getCookie(event, "accessToken"));
  const { secret } = useRuntimeConfig();
  const { userId } = await verify(accessToken, secret);
  return userId;
};

export default getUserId;
