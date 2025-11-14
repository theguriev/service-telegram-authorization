import { z } from "zod";

const requestBodySchema = z.object({
	addresses: z.array(z.string()).min(1, "At least one address is required"),
});

export default defineEventHandler(async (event) => {
	// Валидация тела запроса
	const { addresses } = await zodValidateBody(event, requestBodySchema.parse);

	// Проверка авторизации
	let userId: string | null = null;

	try {
		userId = await getUserId(event);
	} catch {
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
		}); // Исключаем приватный ключ из результата

		return users;
	} catch {
		throw createError({
			message: "Failed to fetch users by addresses",
			statusCode: 500,
		});
	}
});
