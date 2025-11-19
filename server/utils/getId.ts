import type { EventHandlerRequest, H3Event } from "h3";

const getId = async (event: H3Event<EventHandlerRequest>) => {
	const accessToken = String(getCookie(event, "accessToken"));
	const { secret } = useRuntimeConfig();
	const { id } = await verify(accessToken, secret);
	return id;
};

export default getId;
