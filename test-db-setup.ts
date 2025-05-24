export const adminUserSeedData = {
  id: 379669527,
  firstName: "AdminSeedFirstName",
  lastName: "AdminSeedLastName",
  username: "testadminseeduser",
  photoUrl: "https://example.com/adminseed.jpg",
  authDate: Math.floor(Date.now() / 1000) - 7200,
  hash: "seed-admin-hash",
  role: "admin",
};

export const regularUserSeedData = {
  id: 123456789, // Telegram ID, must match regularUserLoginPayload in users.test.ts
  firstName: "RegularSeedUser",
  lastName: "TestSeed",
  username: "testregularseeduser",
  photoUrl: "https://example.com/regularseed.jpg",
  authDate: Math.floor(Date.now() / 1000) - 7200,
  hash: "seed-regular-hash", // Placeholder
  role: "user",
};

export async function clearTestData() {
  try {
    await ModelUser.deleteMany({});
    await ModelToken.deleteMany({});
    console.log("Test database cleared successfully.");
  } catch (error) {
    console.error("Error clearing test database:", error);
    throw error; // Rethrow to fail test setup if clearing fails
  }
}

export async function seedTestData() {
  try {
    await ModelUser.create([adminUserSeedData, regularUserSeedData]);
    console.log("Test database seeded successfully.");
  } catch (error) {
    console.error("Error seeding test database:", error);
    // Handle potential duplicate key errors if collections weren't cleared properly,
    // though clearTestData should prevent this.
    if (error.code === 11000) {
      console.warn(
        "Duplicate key error during seeding. This might indicate an issue with clearing data or ObjectId reuse."
      );
    }
    throw error; // Rethrow to fail test setup if seeding fails
  }
}
