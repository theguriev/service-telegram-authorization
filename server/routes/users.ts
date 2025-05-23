import { ObjectId } from "mongodb";

const querySchema = z.object({
  offset: z.number().int().default(0),
  limit: z.number().int().default(10),
  search: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const { offset = 0, limit = 10, search } = getQuery(event);
  const convertedOffset = Number(offset);
  const convertedLimit = Number(limit);
  const convertedSearch = String(search);
  const userId = await getUserId(event);

  const user = await ModelUser.findById(new ObjectId(String(userId)));

  if (!user) {
    throw createError({
      message: "User not found",
      statusCode: 404,
    });
  }
  if (user.role !== "admin") {
    throw createError({
      message: "You are not authorized to perform this action",
      statusCode: 403,
    });
  }

  await zodValidateData(
    {
      offset: convertedOffset,
      limit: convertedLimit,
    },
    querySchema.parse
  );

  if (!convertedSearch) {
    return ModelUser.find().skip(convertedOffset).limit(convertedLimit);
  }

  return ModelUser.find({
    $or: [
      { firstName: { $regex: new RegExp(convertedSearch, "i") } },
      { lastName: { $regex: new RegExp(convertedSearch, "i") } },
    ],
  })
    .skip(convertedOffset)
    .limit(convertedLimit);
});
