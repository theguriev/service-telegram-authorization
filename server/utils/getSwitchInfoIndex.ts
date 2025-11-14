import type { EventHandlerRequest, H3Event } from "h3";

const getSwitchInfoIndex = async (event: H3Event<EventHandlerRequest>) => {
	const accessToken = String(getCookie(event, "accessToken"));
	const { secret } = useRuntimeConfig();
	const { switchInfoIndex } = await verify(accessToken, secret);
	return switchInfoIndex;
};

export default getSwitchInfoIndex;
