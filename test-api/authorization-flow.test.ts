import type { FetchResponse } from "ofetch";
import { regularId } from "../constants";

const body = {
	id: 379669527,
	firstName: "eugen",
	lastName: "guriev",
	username: "theguriev",
	photoUrl:
		"https://t.me/i/userpic/320/RzvNak5c9L4Q7SgN8kNw-NHzli47jbL76HLk8rP3y8o.jpg",
	authDate: 1738000347,
};

const hash = generateTelegramHash(body, process.env.NITRO_BOT_TOKEN);
let validRefreshToken: string;
let validAccessToken: string;
let validUserId: string;

const accessAndRefreshToBeDefined = (response: FetchResponse<unknown>) => {
	const setCookie = extractSetCookie(response.headers);
	const refreshTokenObj = setCookie.find(
		(cookie) => cookie.name === "refreshToken",
	);
	const accessTokenObj = setCookie.find(
		(cookie) => cookie.name === "accessToken",
	);
	expect(refreshTokenObj).toBeDefined();
	expect(accessTokenObj).toBeDefined();

	return {
		refreshToken: refreshTokenObj.value,
		accessToken: accessTokenObj.value,
	};
};

describe.sequential("Authorization", () => {
	let adminAccessToken: string;

	beforeAll(async () => {
		adminAccessToken = process.env.VALID_ADMIN_ACCESS_TOKEN;
	});

	describe("POST /login", () => {
		it("gets 400 on validation errors", async () => {
			await $fetch("/login", {
				baseURL: process.env.API_URL,
				method: "POST",
				ignoreResponseError: true,
				headers: { Accept: "application/json" },
				body: { id: 0 },
				onResponse: ({ response }) => {
					expect(response.status).toBe(400);
				},
			});
		});
		it("gets 403 on invalid user hash", async () => {
			await $fetch("/login", {
				baseURL: process.env.API_URL,
				method: "POST",
				headers: { Accept: "application/json" },
				ignoreResponseError: true,
				body: {
					...body,
					hash: "invalid",
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(403);
				},
			});
		});
		it("gets 200 on valid for user without lastName", async () => {
			const newBody = { ...body, lastName: null };
			await $fetch("/login", {
				baseURL: process.env.API_URL,
				method: "POST",
				headers: { Accept: "application/json" },
				body: {
					...newBody,
					hash: generateTelegramHash(newBody, process.env.NITRO_BOT_TOKEN),
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data).toMatchObject(newBody);
				},
			});
		});
		it("gets 200 on valid user hash", async () => {
			await $fetch("/login", {
				baseURL: process.env.API_URL,
				method: "POST",
				headers: { Accept: "application/json" },
				body: {
					...body,
					hash,
				},
				onResponse: ({ response }) => {
					const setCookie = extractSetCookie(response.headers);
					const refreshTokenObj = setCookie.find(
						(cookie) => cookie.name === "refreshToken",
					);
					const accessTokenObj = setCookie.find(
						(cookie) => cookie.name === "accessToken",
					);
					validRefreshToken = refreshTokenObj.value;
					validAccessToken = accessTokenObj.value;
					expect(response.status).toBe(200);
					expect(response._data).toMatchObject(body);
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
					accessAndRefreshToBeDefined(response);
					validUserId = response._data._id;
				},
			});
		});
		it("gets 200 on valid second authorization", async () => {
			const newAuthDate = body.authDate + 100;
			const newBody = { ...body, authDate: newAuthDate };
			await $fetch("/login", {
				baseURL: process.env.API_URL,
				method: "POST",
				headers: { Accept: "application/json" },
				body: {
					...newBody,
					hash: generateTelegramHash(newBody, process.env.NITRO_BOT_TOKEN),
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data).toMatchObject(newBody);
					accessAndRefreshToBeDefined(response);
				},
			});
		});
	});

	describe("GET /", () => {
		it("gets 500 on wrong access token", async () => {
			await $fetch("/", {
				baseURL: process.env.API_URL,
				headers: {
					Accept: "application/json",
					Cookie: "accessToken=invalid;",
				},
				ignoreResponseError: true,
				onResponse: ({ response }) => {
					expect(response.status).toBe(500);
				},
			});
		});

		it("gets 200 valid user", async () => {
			await $fetch("/", {
				baseURL: process.env.API_URL,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});
	});

	describe("GET /initial", () => {
		it("gets 500 on wrong access token", async () => {
			await $fetch("/initial", {
				baseURL: process.env.API_URL,
				headers: {
					Accept: "application/json",
					Cookie: "accessToken=invalid;",
				},
				ignoreResponseError: true,
				onResponse: ({ response }) => {
					expect(response.status).toBe(500);
				},
			});
		});

		it("gets 200 valid user", async () => {
			await $fetch("/initial", {
				baseURL: process.env.API_URL,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});
	});

	describe("POST /login/web-app", () => {
		it("gets 400 on validation errors", async () => {
			await $fetch("/login/web-app", {
				baseURL: process.env.API_URL,
				method: "POST",
				ignoreResponseError: true,
				headers: { Accept: "application/json" },
				body: { query_id: "test" },
				onResponse: ({ response }) => {
					expect(response.status).toBe(400);
				},
			});
		});

		it("gets 200 on valid web app authorization", async () => {
			const newBody = {
				queryId: "AAEXTKEWAAAAABdMoRawpVCK",
				user: JSON.stringify(body),
				authDate: 1745179538,
				signature:
					"zQf7zeXzKVekQpFT8Zxuf7_gxIuj3xAdo1ZtZn2_gEP4lHJgt0KUeBIEH6iAJp--n56H7ZHXYxco1zpW2a5CAA",
			};

			await $fetch("/login/web-app", {
				baseURL: process.env.API_URL,
				method: "POST",
				headers: { Accept: "application/json" },
				body: {
					...newBody,
					hash: generateTelegramHash(
						newBody,
						process.env.NITRO_BOT_TOKEN,
						true,
					),
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					const userData = JSON.parse(newBody.user);
					expect(response._data).toMatchObject({
						id: userData.id,
						firstName: userData.firstName,
						username: userData.username,
					});
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
					accessAndRefreshToBeDefined(response);
				},
			});
		});
	});

	describe("GET /refresh", () => {
		it("gets 404 on invalid refresh token", async () => {
			await $fetch("/refresh", {
				baseURL: process.env.API_URL,
				headers: { Accept: "application/json" },
				ignoreResponseError: true,
				onResponse: ({ response }) => {
					expect(response.status).toBe(404);
					expect(response._data).toMatchObject({
						message: "Refresh token not found!",
					});
				},
			});
		});
		it("gets 200 on valid refresh token", async () => {
			await $fetch("/refresh", {
				baseURL: process.env.API_URL,
				headers: {
					Accept: "application/json",
					Cookie: `refreshToken=${validRefreshToken}`,
				},
				onResponse: async ({ response }) => {
					expect(response.status).toBe(200);
					const { accessToken } = accessAndRefreshToBeDefined(response);
					const verified = await verify(accessToken, process.env.SECRET);
					expect(verified.id).toBeDefined();
					expect(verified.role).toBeDefined();
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});
	});

	describe("PUT /update-meta", () => {
		it("changes the user name", async () => {
			await $fetch("/update-meta", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				body: { meta: { firstName: "John", lastName: "Doe" } },
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data.meta.firstName).toBe("John");
					expect(response._data.meta.lastName).toBe("Doe");
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});

		it("validation error on wrong userId", async () => {
			await $fetch("/update-meta", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				ignoreResponseError: true,
				body: {
					meta: { firstName: "John", lastName: "Doe" },
					userId: "wrongUserId",
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(400);
				},
			});
		});

		it("authorization error on user updating other user", async () => {
			await $fetch("/update-meta", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				ignoreResponseError: true,
				body: {
					meta: { firstName: "John", lastName: "Doe" },
					userId: regularId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(403);
				},
			});
		});

		it("user not found error on updating non existing user", async () => {
			await $fetch("/update-meta", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken}`,
				},
				ignoreResponseError: true,
				body: {
					meta: { firstName: "John", lastName: "Doe" },
					userId: "000000000000000000000000",
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(409);
				},
			});
		});

		it("success on updating existing user by admin", async () => {
			await $fetch("/update-meta", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken}`,
				},
				body: {
					meta: { firstName: "John", lastName: "Doe" },
					userId: validUserId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data._id).toBe(validUserId);
					expect(response._data.meta.firstName).toBe("John");
					expect(response._data.meta.lastName).toBe("Doe");
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});

		it("success on updating existing user by himself", async () => {
			await $fetch("/update-meta", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				body: {
					meta: { firstName: "John", lastName: "Doe" },
					userId: validUserId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data._id).toBe(validUserId);
					expect(response._data.meta.firstName).toBe("John");
					expect(response._data.meta.lastName).toBe("Doe");
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});
	});

	describe("PUT /update-feature-flags", () => {
		it("updates feature flags", async () => {
			await $fetch("/update-feature-flags", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				body: { featureFlags: ["flag1", "flag2"] },
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data.featureFlags).toEqual(["flag1", "flag2"]);
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});

		it("validation error on wrong userId", async () => {
			await $fetch("/update-feature-flags", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				ignoreResponseError: true,
				body: {
					featureFlags: ["flag1", "flag2"],
					userId: "wrongUserId",
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(400);
				},
			});
		});

		it("authorization error on user updating other user", async () => {
			await $fetch("/update-feature-flags", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				ignoreResponseError: true,
				body: {
					featureFlags: ["flag1", "flag2"],
					userId: regularId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(403);
				},
			});
		});

		it("user not found error on updating non existing user", async () => {
			await $fetch("/update-feature-flags", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken}`,
				},
				ignoreResponseError: true,
				body: {
					featureFlags: ["flag1", "flag2"],
					userId: "000000000000000000000000",
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(409);
				},
			});
		});

		it("success on updating existing user by admin", async () => {
			await $fetch("/update-feature-flags", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken}`,
				},
				body: {
					featureFlags: ["flag1", "flag2"],
					userId: validUserId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data._id).toBe(validUserId);
					expect(response._data.featureFlags).toEqual(["flag1", "flag2"]);
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});

		it("success on updating existing user by himself", async () => {
			await $fetch("/update-feature-flags", {
				baseURL: process.env.API_URL,
				method: "PUT",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${validAccessToken}`,
				},
				body: {
					featureFlags: ["flag1", "flag2"],
					userId: validUserId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data._id).toBe(validUserId);
					expect(response._data.featureFlags).toEqual(["flag1", "flag2"]);
					expect(response._data.privateKey).toBeUndefined();
					expect(response._data.address).toBeDefined();
				},
			});
		});
	});
});
