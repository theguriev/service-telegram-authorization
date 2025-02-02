import type { Cookie } from "set-cookie-parser";
import type { FetchResponse } from "ofetch";

const baseURL = "http://localhost:3000";
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
};

describe.sequential("Authorization", () => {
  let validRefreshToken: Cookie;
  let validAccessToken: Cookie;
  describe("POST /login", () => {
    it("gets 400 on validation errors", async () => {
      await $fetch("/login", {
        baseURL,
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
        baseURL,
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
    it("gets 200 on valid user hash", async () => {
      await $fetch("/login", {
        baseURL,
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
          validRefreshToken = refreshTokenObj!;
          validAccessToken = accessTokenObj!;
          expect(response.status).toBe(200);
          expect(response._data).toMatchObject(body);
          accessAndRefreshToBeDefined(response);
        },
      });
    });
    it("gets 200 on valid second authorization", async () => {
      const newAuthDate = body.authDate + 100;
      const newBody = { ...body, authDate: newAuthDate };
      await $fetch("/login", {
        baseURL,
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
        baseURL: "http://localhost:3000",
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
        baseURL: "http://localhost:3000",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${validAccessToken.value};`,
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
        baseURL: "http://localhost:3000",
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
        baseURL: "http://localhost:3000",
        headers: {
          Accept: "application/json",
          Cookie: `refreshToken=${validRefreshToken.value}`,
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200);
          accessAndRefreshToBeDefined(response);
        },
      });
    });
  });
});
