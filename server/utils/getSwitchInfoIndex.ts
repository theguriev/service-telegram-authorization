import type { EventHandlerRequest, H3Event } from "h3";

const getSwitchInfoIndex = async (event: H3Event<EventHandlerRequest>) => {
	const accessToken = getAccessToken(event);
	const { secret } = useRuntimeConfig();
	const { switchInfoIndex } = await verify(accessToken, secret);
	return switchInfoIndex;
};

export default getSwitchInfoIndex;
