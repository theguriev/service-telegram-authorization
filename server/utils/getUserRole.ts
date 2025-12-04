import type { EventHandlerRequest, H3Event } from "h3";

const getUserRole = async (event: H3Event<EventHandlerRequest>) => {
	const accessToken = getAccessToken(event);
	const { secret } = useRuntimeConfig();
	const { role } = await verify(accessToken, secret);
	return role;
};

export default getUserRole;
