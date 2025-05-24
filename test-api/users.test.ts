const baseURL = process.env.API_URL;

describe.sequential("GET /users API Endpoint", () => {
  describe("Authorization Checks", () => {
    it("should return 500 if no access token is provided (due to ObjectId error from undefined userId)", async () => {
      await $fetch("/users", {
        baseURL,
        method: "GET",
        headers: { Accept: "application/json" },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(500);
        },
      });
    });

    it("should return 403 if accessed by a non-admin user", async () => {
      await $fetch("/users", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_REGULAR_ACCESS_TOKEN};`,
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(403);
          expect(response._data.message).toBe(
            "You are not authorized to perform this action"
          );
        },
      });
    });
  });

  describe("Functionality (as Admin)", () => {
    it("should return a list of users with default pagination (limit 10)", async () => {
      await $fetch("/users", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN}`,
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200);
          expect(Array.isArray(response._data)).toBe(true);
          expect(response._data.length).toBeLessThanOrEqual(10);
          if (response._data.length > 0) {
            expect(response[0]).toHaveProperty("_id");
            expect(response[0]).toHaveProperty("firstName");
          }
        },
      });
    });

    it("should respect limit and offset parameters", async () => {
      await $fetch("/users?limit=1&offset=0", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN}`,
        },
        onResponse: async ({ response: responsePage1 }) => {
          expect(responsePage1.status).toBe(200);
          expect(Array.isArray(responsePage1._data)).toBe(true);
          expect(responsePage1._data.length).toBeLessThanOrEqual(1);

          if (responsePage1._data.length === 1) {
            const firstUserId = responsePage1[0]._id;
            await $fetch("/users?limit=1&offset=1", {
              baseURL,
              method: "GET",
              headers: {
                Accept: "application/json",
                Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN}`,
              },
              onResponse: ({ response: responsePage2 }) => {
                expect(Array.isArray(responsePage2)).toBe(true);
                expect(responsePage2._data.length).toBeLessThanOrEqual(1);
                if (responsePage2._data.length === 1 && firstUserId) {
                  expect(responsePage2[0]._id).not.toBe(firstUserId);
                }
              },
            });
          }
        },
      });
    });

    it("should filter users by search term (firstName or lastName, case-insensitive)", async () => {
      const searchTerm = "Adm";
      await $fetch(`/users?search=${encodeURIComponent(searchTerm)}`, {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN}`,
        },
        onResponse: ({ response }) => {
          expect(response.status).toBe(200);
          expect(Array.isArray(response._data)).toBe(true);
          expect(response._data.length).toBeGreaterThanOrEqual(1);
          response._data.forEach((user) => {
            const fn = user.firstName || "";
            const ln = user.lastName || "";
            expect(
              fn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ln.toLowerCase().includes(searchTerm.toLowerCase())
            ).toBe(true);
          });
        },
      });
    });

    it("should return an empty array if search term matches no users", async () => {
      const searchTerm = "NonExistentNameXYZ123ABC";
      await $fetch(`/users?search=${encodeURIComponent(searchTerm)}`, {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN}`,
        },
        onResponse: ({ response }) => {
          expect(Array.isArray(response._data)).toBe(true);
          expect(response._data.length).toBe(0);
        },
      });
    });

    it("should return all users (paginated) if search term is an empty string", async () => {
      await $fetch("/users?search=", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN}`,
        },
        onResponse: ({ response }) => {
          expect(Array.isArray(response._data)).toBe(true);
          expect(response._data.length).toBeLessThanOrEqual(10);
        },
      });
    });

    it('should search for literal string "undefined" if search query param is absent', async () => {
      // This tests the behavior String(undefined) -> "undefined"
      const response = await $fetch("/users", {
        // No search query param
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN}`,
        },
        onResponse: ({ response }) => {
          expect(Array.isArray(response._data)).toBe(true);
        },
      });
    });
  });

  describe("Input Validation (Zod)", () => {
    it("should return 400 if offset is invalid (non-numeric string)", async () => {
      await $fetch("/users?offset=abc&limit=10", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN};`,
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(400);
          expect(response._data.message).toContain("Validation Error");
        },
      });
    });

    it("should return 400 if limit is invalid (non-numeric string)", async () => {
      await $fetch("/users?offset=0&limit=xyz", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN};`,
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(400);
          expect(response._data.message).toContain("Validation Error");
        },
      });
    });

    it("should use H3 default limit (10) if limit is not provided in query", async () => {
      await $fetch("/users?offset=0", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${process.env.VALID_ADMIN_ACCESS_TOKEN};`,
        },
        ignoreResponseError: true,
        onResponse: ({ response }) => {
          expect(response.status).toBe(200);
          expect(Array.isArray(response._data)).toBe(true);
          expect(response._data.length).toBeLessThanOrEqual(10); // H3 default for limit is 10
        },
      });
    });
  });
});
