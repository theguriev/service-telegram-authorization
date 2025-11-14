import type { Cookie } from "set-cookie-parser";

const extractSetCookie = (headers: Headers) => {
	const setCookie: Array<Cookie> = [];
	headers.forEach((value, key) => {
		if (key === "set-cookie") {
			setCookie.push(parse(value)[0]);
		}
	});
	return setCookie;
};

export default extractSetCookie;
