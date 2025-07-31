import { omit } from "es-toolkit";
import { Wallet } from "ethers";
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
    _id: new ObjectId(initialId as string),
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

  const match = convertedSearch
    ? [
        baseQuery,
        {
          $or: [
            { firstName: { $regex: new RegExp(convertedSearch, "i") } },
            { lastName: { $regex: new RegExp(convertedSearch, "i") } },
          ],
        },
      ]
    : [baseQuery];

  const users = await ModelUser.aggregate([
    {
      $match: {
        $and: match,
      },
    },
    {
      $lookup: {
        from: 'wallets',
        localField: '_id',
        foreignField: 'userId',
        as: 'wallet'
      },
    },
    {
      $unwind: {
        path: '$wallet',
        preserveNullAndEmptyArrays: true
      },
    },
    {
      $skip: convertedOffset
    },
    {
      $limit: convertedLimit
    }
  ]);

  const updatedUsers = users.map(user => ({
    ...(omit(user, ["wallet"])),
    publicKey: user.wallet?.privateKey
      ? new Wallet(user.wallet.privateKey).address
      : undefined,
  }));

  return updatedUsers;
});
