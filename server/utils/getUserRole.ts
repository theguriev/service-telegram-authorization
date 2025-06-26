import type { H3Event, EventHandlerRequest } from "h3";
const getUserRole = async (event: H3Event<EventHandlerRequest>) => {
  const accessToken = String(getCookie(event, "accessToken"));
  const { secret } = useRuntimeConfig();
  const { role } = await verify(accessToken, secret);
  return role;
};

export default getUserRole;
