import { regularId } from "../constants";

describe.sequential("Private", () => {
  describe("GET /private/balance/[uid]", () => {
    it("gets 404 on invalid owner", async () => {
      await $fetch("/private/balance/6808bcfb77143eceb802c5a9", {
        baseURL: process.env.API_URL,
        method: "GET",
        ignoreResponseError: true,
        headers: {
          Accept: "application/json",
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(404);
        },
      });
    });
    it("gets 200 on authorized access", async () => {
      await $fetch(`/private/balance/${regularId}`, {
        baseURL: process.env.API_URL,
        method: "GET",
        headers: {
          Accept: "application/json",
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
});
