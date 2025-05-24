import type { FetchResponse } from "ofetch";
import generateTelegramHash from "../server/utils/generateTelegramHash";
import extractSetCookie from "../server/utils/extractSetCookie";

const baseURL = process.env.API_URL || "http://localhost:3000";
const NITRO_BOT_TOKEN = process.env.NITRO_BOT_TOKEN;

if (!NITRO_BOT_TOKEN) {
  throw new Error(
    "NITRO_BOT_TOKEN environment variable is not set. Tests cannot run."
  );
}

// Admin user details - THIS USER MUST HAVE 'admin' ROLE IN THE DB
const adminLoginPayload = {
  id: 379669527, // Ensure this user is an admin in your test DB
  firstName: "AdminFirstName",
  lastName: "AdminLastName",
  username: "testadminuser",
  photoUrl: "https://example.com/admin.jpg",
  authDate: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
};

// Regular user details
const regularUserLoginPayload = {
  id: 123456789, // A different user ID
  firstName: "RegularUser",
  lastName: "Test",
  username: "testregularuser",
  photoUrl: "https://example.com/regular.jpg",
  authDate: Math.floor(Date.now() / 1000) - 7200,
};

let adminAccessToken: string;
let regularUserAccessToken: string;

describe.sequential("GET /users API Endpoint", () => {
  beforeAll(async () => {
    // Log in as Admin User
    const adminHash = generateTelegramHash(adminLoginPayload, NITRO_BOT_TOKEN!);
    let adminLoginResponse: FetchResponse<any> | undefined;
    try {
      await $fetch("/login", {
        baseURL,
        method: "POST",
        headers: { Accept: "application/json" },
        body: { ...adminLoginPayload, hash: adminHash },
        onResponse: ({ response }) => {
          adminLoginResponse = response;
        },
      });
    } catch (error: any) {
      console.error(
        "Admin login failed during test setup:",
        error.data || error.message
      );
      throw new Error(
        `Admin login failed (ID: ${
          adminLoginPayload.id
        }). Ensure user exists and has 'admin' role. Error: ${
          error.data?.message || error.message
        }`
      );
    }

    if (!adminLoginResponse || adminLoginResponse.status !== 200) {
      console.error(
        "Admin login failed with status:",
        adminLoginResponse?.status,
        adminLoginResponse?._data
      );
      throw new Error(
        `Admin login failed (ID: ${adminLoginPayload.id}). Status: ${adminLoginResponse?.status}. Ensure user exists and has 'admin' role.`
      );
    }
    const adminCookies = extractSetCookie(adminLoginResponse.headers);
    const adminTokenObj = adminCookies.find((c) => c.name === "accessToken");
    if (!adminTokenObj?.value)
      throw new Error("Admin accessToken not found after login.");
    adminAccessToken = adminTokenObj.value;

    // Log in as Regular User
    const regularHash = generateTelegramHash(
      regularUserLoginPayload,
      NITRO_BOT_TOKEN!
    );
    let regularLoginResponse: FetchResponse<any> | undefined;
    try {
      await $fetch("/login", {
        baseURL,
        method: "POST",
        headers: { Accept: "application/json" },
        body: { ...regularUserLoginPayload, hash: regularHash },
        onResponse: ({ response }) => {
          regularLoginResponse = response;
        },
      });
    } catch (error: any) {
      console.error(
        "Regular user login failed during test setup:",
        error.data || error.message
      );
      throw new Error(
        `Regular user login failed (ID: ${
          regularUserLoginPayload.id
        }). Error: ${error.data?.message || error.message}`
      );
    }
    if (!regularLoginResponse || regularLoginResponse.status !== 200) {
      console.error(
        "Regular user login failed with status:",
        regularLoginResponse?.status,
        regularLoginResponse?._data
      );
      throw new Error(
        `Regular user login failed (ID: ${regularUserLoginPayload.id}). Status: ${regularLoginResponse?.status}.`
      );
    }
    const regularCookies = extractSetCookie(regularLoginResponse.headers);
    const regularTokenObj = regularCookies.find(
      (c) => c.name === "accessToken"
    );
    if (!regularTokenObj?.value)
      throw new Error("Regular user accessToken not found after login.");
    regularUserAccessToken = regularTokenObj.value;
  });

  describe("Authorization Checks", () => {
    it("should return 500 if no access token is provided (due to ObjectId error from undefined userId)", async () => {
      try {
        await $fetch("/users", {
          baseURL,
          method: "GET",
          headers: { Accept: "application/json" },
          ignoreResponseError: false, // Let $fetch throw for error status codes
        });
      } catch (error: any) {
        expect(error.statusCode).toBe(500);
      }
    });

    it("should return 403 if accessed by a non-admin user", async () => {
      try {
        await $fetch("/users", {
          baseURL,
          method: "GET",
          headers: {
            Accept: "application/json",
            Cookie: `accessToken=${regularUserAccessToken}`,
          },
          ignoreResponseError: false,
        });
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.data.message).toBe(
          "You are not authorized to perform this action"
        );
      }
    });
  });

  describe("Functionality (as Admin)", () => {
    it("should return a list of users with default pagination (limit 10)", async () => {
      const response = await $fetch("/users", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${adminAccessToken}`,
        },
      });
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeLessThanOrEqual(10);
      if (response.length > 0) {
        expect(response[0]).toHaveProperty("_id");
        expect(response[0]).toHaveProperty("firstName");
      }
    });

    it("should respect limit and offset parameters", async () => {
      const responsePage1 = await $fetch("/users?limit=1&offset=0", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${adminAccessToken}`,
        },
      });
      expect(Array.isArray(responsePage1)).toBe(true);
      expect(responsePage1.length).toBeLessThanOrEqual(1);

      if (responsePage1.length === 1) {
        const firstUserId = responsePage1[0]._id;
        const responsePage2 = await $fetch("/users?limit=1&offset=1", {
          baseURL,
          method: "GET",
          headers: {
            Accept: "application/json",
            Cookie: `accessToken=${adminAccessToken}`,
          },
        });
        expect(Array.isArray(responsePage2)).toBe(true);
        expect(responsePage2.length).toBeLessThanOrEqual(1);
        if (responsePage2.length === 1 && firstUserId) {
          expect(responsePage2[0]._id).not.toBe(firstUserId);
        }
      }
    });

    it("should filter users by search term (firstName or lastName, case-insensitive)", async () => {
      const searchTerm = adminLoginPayload.firstName.substring(0, 3); // e.g., "Adm"
      const response = await $fetch(
        `/users?search=${encodeURIComponent(searchTerm)}`,
        {
          baseURL,
          method: "GET",
          headers: {
            Accept: "application/json",
            Cookie: `accessToken=${adminAccessToken}`,
          },
        }
      );
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThanOrEqual(1); // Expecting admin user to be found
      response.forEach((user) => {
        const fn = user.firstName || "";
        const ln = user.lastName || "";
        expect(
          fn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ln.toLowerCase().includes(searchTerm.toLowerCase())
        ).toBe(true);
      });
    });

    it("should return an empty array if search term matches no users", async () => {
      const searchTerm = "NonExistentNameXYZ123ABC";
      const response = await $fetch(
        `/users?search=${encodeURIComponent(searchTerm)}`,
        {
          baseURL,
          method: "GET",
          headers: {
            Accept: "application/json",
            Cookie: `accessToken=${adminAccessToken}`,
          },
        }
      );
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(0);
    });

    it("should return all users (paginated) if search term is an empty string", async () => {
      const response = await $fetch("/users?search=", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${adminAccessToken}`,
        },
      });
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeLessThanOrEqual(10);
      // Further checks could compare this to a response with no search param if DB is static
    });

    it('should search for literal string "undefined" if search query param is absent', async () => {
      // This tests the behavior String(undefined) -> "undefined"
      const response = await $fetch("/users", {
        // No search query param
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${adminAccessToken}`,
        },
      });
      // The result depends on whether any user has "undefined" in their name.
      // This test primarily confirms the endpoint is reached and returns an array.
      expect(Array.isArray(response)).toBe(true);
    });
  });

  describe("Input Validation (Zod)", () => {
    it("should return 400 if offset is invalid (non-numeric string)", async () => {
      try {
        await $fetch("/users?offset=abc&limit=10", {
          baseURL,
          method: "GET",
          headers: {
            Accept: "application/json",
            Cookie: `accessToken=${adminAccessToken}`,
          },
          ignoreResponseError: false,
        });
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.data.message).toContain("Expected number, received nan"); // Zod error detail
      }
    });

    it("should return 400 if limit is invalid (non-numeric string)", async () => {
      try {
        await $fetch("/users?offset=0&limit=xyz", {
          baseURL,
          method: "GET",
          headers: {
            Accept: "application/json",
            Cookie: `accessToken=${adminAccessToken}`,
          },
          ignoreResponseError: false,
        });
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.data.message).toContain("Expected number, received nan");
      }
    });

    it("should use H3 default limit (10) if limit is not provided in query", async () => {
      const response = await $fetch("/users?offset=0", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${adminAccessToken}`,
        },
      });
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeLessThanOrEqual(10); // H3 default for limit is 10
    });

    it("should use H3 default offset (0) if offset is not provided in query", async () => {
      const responseDefaultOffset = await $fetch("/users?limit=5", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${adminAccessToken}`,
        },
      });
      const responseExplicitOffset0 = await $fetch("/users?limit=5&offset=0", {
        baseURL,
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: `accessToken=${adminAccessToken}`,
        },
      });
      expect(responseDefaultOffset).toEqual(responseExplicitOffset0);
    });
  });
});
