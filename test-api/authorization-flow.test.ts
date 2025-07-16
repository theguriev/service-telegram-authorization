import type { FetchResponse } from "ofetch";

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

const accessAndRefreshToBeDefined = (response: FetchResponse<any>) => {
  const setCookie = extractSetCookie(response.headers);
  const refreshTokenObj = setCookie.find(
    (cookie) => cookie.name === "refreshToken"
  );
  const accessTokenObj = setCookie.find(
    (cookie) => cookie.name === "accessToken"
  );
  expect(refreshTokenObj).toBeDefined();
  expect(accessTokenObj).toBeDefined();

  return {
    refreshToken: refreshTokenObj.value,
    accessToken: accessTokenObj.value,
  };
};

describe.sequential("Authorization", () => {
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
          expect(response._data.privateKey).toBeUndefined();
          expect(response._data.address).toBeDefined();
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
            (cookie) => cookie.name === "refreshToken"
          );
          const accessTokenObj = setCookie.find(
            (cookie) => cookie.name === "accessToken"
          );
          validRefreshToken = refreshTokenObj.value;
          validAccessToken = accessTokenObj.value;
          expect(response.status).toBe(200);
          expect(response._data).toMatchObject(body);
          expect(response._data.privateKey).toBeUndefined();
          expect(response._data.address).toBeDefined();
          accessAndRefreshToBeDefined(response);
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
          expect(response._data.privateKey).toBeUndefined();
          expect(response._data.address).toBeDefined();
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
            true
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
          accessAndRefreshToBeDefined(response);
        },
      });
    });
  });

  describe("POST /login/switch API Endpoint", () => {
    let adminAccessToken;
    let regularAccessToken;
    let testUserId;

    beforeAll(async () => {
      // Use environment variables or setup logic to get tokens and a test user
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
          testUserId = response._data._id;
        },
      });
    });

    it("should return 500 if not authenticated", async () => {
      await $fetch("/login/switch", {
        baseURL: process.env.API_URL,
        method: "POST",
        body: { id: testUserId },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(500);
        },
      });
    });

    it("should return 403 if not admin", async () => {
      await $fetch("/login/switch", {
        baseURL: process.env.API_URL,
        method: "POST",
        body: { id: testUserId },
        headers: {
          Cookie: `accessToken=${regularAccessToken}`,
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(403);
        },
      });
    });

    it("should return 400 if userId is missing", async () => {
      await $fetch("/login/switch", {
        baseURL: process.env.API_URL,
        method: "POST",
        headers: {
          Cookie: `accessToken=${adminAccessToken}`,
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(400);
        },
      });
    });

    it("should return 404 if user not found", async () => {
      await $fetch("/login/switch", {
        baseURL: process.env.API_URL,
        method: "POST",
        body: { id: "000000000000000000000000" },
        headers: {
          Cookie: `accessToken=${adminAccessToken}`,
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(404);
        },
      });
    });

    let switchedAccessToken;

    it("should switch tokens and return user if admin and user exists", async () => {
      if (!testUserId) return;
      await $fetch("/login/switch", {
        baseURL: process.env.API_URL,
        method: "POST",
        body: { id: testUserId },
        headers: {
          Cookie: `accessToken=${adminAccessToken}`,
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200);
          expect(response._data).toHaveProperty("_id", testUserId);
          const setCookie = extractSetCookie(response.headers);
          const refreshTokenObj = setCookie.find(
            (cookie) => cookie.name === "refreshToken"
          );
          const accessTokenObj = setCookie.find(
            (cookie) => cookie.name === "accessToken"
          );
          expect(refreshTokenObj).toBeDefined();
          expect(accessTokenObj).toBeDefined();
          switchedAccessToken = accessTokenObj.value;
        },
      });
    });

    it("gets 200 valid switched user", async () => {
      await $fetch("/", {
        baseURL: process.env.API_URL,
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${switchedAccessToken};`,
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200);
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
        },
      });
    });
  });
});
