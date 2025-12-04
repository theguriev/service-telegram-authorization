import type { EventHandlerRequest, H3Event } from "h3";

const getRefreshToken = async (event: H3Event<EventHandlerRequest>) => {
	return ((await readBody(event, { strict: true }))["refreshToken"]?.trim() ||
		getCookie(event, "refreshToken")?.trim()) as string | undefined;
};

export default getRefreshToken;
