import { z } from "zod";

const requestBodySchema = z.object({
  addresses: z.array(z.string()).min(1, "At least one address is required"),
});

export default defineEventHandler(async (event) => {
  // Валидация тела запроса
  const { addresses } = await zodValidateBody(event, requestBodySchema.parse);

  // Проверка авторизации
  let userId;

  try {
    userId = await getUserId(event);
  } catch (error) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  if (!userId) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  try {
    const users = await ModelUser.find({
      address: { $in: addresses },
    });

    return users;
  } catch (error) {
    throw createError({
      message: "Failed to fetch users by addresses",
      statusCode: 500,
    });
  }
});
