import type { EventHandlerRequest, H3Event } from "h3";

const getSwitchInfo = async (event: H3Event<EventHandlerRequest>) => {
	const accessToken = String(getCookie(event, "accessToken"));
	const { secret } = useRuntimeConfig();
	const { switchInfoId } = await verify(accessToken, secret);
	if (!switchInfoId) {
		return undefined;
	}

	const switchInfo = await ModelSwitchInfo.findById(switchInfoId);
	if (!switchInfo) {
		throw createError({
			statusCode: 400,
			statusMessage: "Switch info not found",
		});
	}
	return switchInfo;
};

export default getSwitchInfo;
