import { addHours } from "date-fns";

export const imports = [
	{ name: "describe", from: "vitest" },
	{ name: "it", from: "vitest" },
	{ name: "expect", from: "vitest" },
	{ name: "beforeAll", from: "vitest" },
	{ name: "afterAll", from: "vitest" },
	{ name: "v4", as: "uuidv4", from: "uuid" },
	{ name: "parse", from: "set-cookie-parser" },
	{ name: "can", from: "~/permission" },
	{ name: "matchCan", from: "~/permission" },
];

export const adminId = "6808bcfb77143eceb802c5a7";
export const regularId = "6808bcfb77143eceb802c5a8";

export const adminTokenId = "6808bcfb77143eceb802c5a9";
export const regularTokenId = "6808bcfb77143eceb802c5a1";

export const adminToken = "admin token";
export const regularToken = "regular token";

export const testDeviceData = {
	os: "web",
	application: "Mindrafted Test",
	source: "Test",
	fingerprint: "Test",
};

export const bllsBase = "https://api.blls.me";

export const dateDifference = addHours(0, 3);
export const weekends = [0 /* Sunday */];
