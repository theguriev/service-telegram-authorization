import { ObjectId } from "mongodb";

const querySchema = z.object({
  offset: z.number().int().default(0),
  limit: z.number().int().default(10),
  search: z.string().optional(),
});

const getBaseQuery = (
  managerTelegramId: number,
  managerId: string,
  userId: string
) => {
  if (userId !== managerId) {
    return {
      $or: [
        { "meta.managerId": managerTelegramId },
        { _id: new ObjectId(managerId) },
      ],
    };
  } else {
    return { "meta.managerId": managerTelegramId };
  }
};

export default defineEventHandler(async (event) => {
  const { offset = 0, limit = 10, search } = getQuery(event);
  const convertedOffset = Number(offset);
  const convertedLimit = Number(limit);
  const convertedSearch = String(search || "");
  const role = await getUserRole(event);
  const initialId = await getId(event);
  const userId = await getUserId(event);

  if (role !== "admin") {
    throw createError({
      message: "You are not authorized to perform this action",
      statusCode: 403,
    });
  }

  const manager = await ModelUser.findOne({
    _id: new ObjectId(initialId),
  });

  if (!manager) {
    throw createError({
      message: "Manager not found",
      statusCode: 404,
    });
  }

  await zodValidateData(
    {
      offset: convertedOffset,
      limit: convertedLimit,
    },
    querySchema.parse
  );

  const baseQuery = getBaseQuery(manager.id, String(manager._id), userId);

  if (!convertedSearch) {
    return ModelUser.find(baseQuery)
      .skip(convertedOffset)
      .limit(convertedLimit);
  }

  return ModelUser.find({
    $and: [
      baseQuery,
      {
        $or: [
          { firstName: { $regex: new RegExp(convertedSearch, "i") } },
          { lastName: { $regex: new RegExp(convertedSearch, "i") } },
        ],
      },
    ],
  })
    .skip(convertedOffset)
    .limit(convertedLimit);
});
