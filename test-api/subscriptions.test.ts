import { regularId } from "../constants";

describe.sequential("Subscriptions", () => {
	let adminAccessToken: string;
	let regularAccessToken: string;
	let testAccessToken: string;

	beforeAll(async () => {
		adminAccessToken = process.env.VALID_ADMIN_ACCESS_TOKEN;
		regularAccessToken = process.env.VALID_REGULAR_ACCESS_TOKEN;

		const body = {
			id: 379669522,
			firstName: "eugen",
			lastName: "guriev",
			username: "theguriev",
			photoUrl:
				"https://t.me/i/userpic/320/RzvNak5c9L4Q7SgN8kNw-NHzli47jbL76HLk8rP3y8o.jpg",
			authDate: 1738000347,
		};

		await $fetch("/login", {
			baseURL: process.env.API_URL,
			method: "POST",
			headers: { Accept: "application/json" },
			body: {
				...body,
				hash: generateTelegramHash(body, process.env.NITRO_BOT_TOKEN),
			},
			onResponse: async ({ response }) => {
				const setCookie = extractSetCookie(response.headers);
				const accessTokenObj = setCookie.find(
					(cookie) => cookie.name === "accessToken",
				);
				testAccessToken = accessTokenObj.value;
			},
		});
	});

	describe("GET /transactions", () => {
		it("gets 200 on authorized access", async () => {
			await $fetch("/transactions", {
				baseURL: process.env.API_URL,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${testAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data).toEqual([]);
				},
			});
		});
	});

	describe("GET /transactions/[uid]", () => {
		it("gets 403 on unauthorized access", async () => {
			await $fetch(`/transactions/${regularId}`, {
				baseURL: process.env.API_URL,
				method: "GET",
				ignoreResponseError: true,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${regularAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(403);
				},
			});
		});
		it("gets 404 on invalid owner", async () => {
			await $fetch("/transactions/6808bcfb77143eceb802c5a9", {
				baseURL: process.env.API_URL,
				method: "GET",
				ignoreResponseError: true,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(404);
				},
			});
		});
		it("gets 200 on authorized access", async () => {
			await $fetch(`/transactions/${regularId}`, {
				baseURL: process.env.API_URL,
				method: "GET",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data).toEqual([]);
				},
			});
		});
	});

	describe("GET /balance", () => {
		it("gets 200 on authorized access", async () => {
			await $fetch("/balance", {
				baseURL: process.env.API_URL,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${testAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data).toEqual({
						balance: 0,
					});
				},
			});
		});
	});

	describe("GET /balance/[uid]", () => {
		it("gets 403 on unauthorized access", async () => {
			await $fetch(`/balance/${regularId}`, {
				baseURL: process.env.API_URL,
				method: "GET",
				ignoreResponseError: true,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${regularAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(403);
				},
			});
		});
		it("gets 404 on invalid owner", async () => {
			await $fetch("/balance/6808bcfb77143eceb802c5a9", {
				baseURL: process.env.API_URL,
				method: "GET",
				ignoreResponseError: true,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(404);
				},
			});
		});
		it("gets 200 on authorized access", async () => {
			await $fetch(`/balance/${regularId}`, {
				baseURL: process.env.API_URL,
				method: "GET",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken};`,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data).toEqual({
						balance: 0,
					});
				},
			});
		});
	});

	describe("POST /subscription/continue", () => {
		it("gets 403 on unauthorized access", async () => {
			await $fetch("/subscription/continue", {
				baseURL: process.env.API_URL,
				method: "POST",
				ignoreResponseError: true,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${regularAccessToken};`,
				},
				body: {
					receiver: regularId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(403);
				},
			});
		});
		it("gets 404 on invalid receiver", async () => {
			await $fetch("/subscription/continue", {
				baseURL: process.env.API_URL,
				method: "POST",
				ignoreResponseError: true,
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken};`,
				},
				body: {
					receiver: "6808bcfb77143eceb802c5a9",
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(404);
				},
			});
		});
		it("gets 200 on authorized access", async () => {
			await $fetch("/subscription/continue", {
				baseURL: process.env.API_URL,
				method: "POST",
				headers: {
					Accept: "application/json",
					Cookie: `accessToken=${adminAccessToken};`,
				},
				body: {
					receiver: regularId,
				},
				onResponse: ({ response }) => {
					expect(response.status).toBe(200);
					expect(response._data).toEqual({
						success: true,
					});
				},
			});
		});
	});
});
