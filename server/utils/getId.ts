import type { EventHandlerRequest, H3Event } from "h3";

const getId = async (event: H3Event<EventHandlerRequest>) => {
	const accessToken = getAccessToken(event);
	const { secret } = useRuntimeConfig();
	const { id } = await verify(accessToken, secret);
	return id;
};

export default getId;
