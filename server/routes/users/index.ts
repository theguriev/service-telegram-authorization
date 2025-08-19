import { startOfDay, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ObjectId } from "mongodb";
import { PipelineStage } from "mongoose";
import { z } from "zod";
import { dateDifference } from "~~/constants";

const querySchema = z.object({
  offset: z.coerce.number().int().default(0),
  limit: z.coerce.number().int().default(10),
  search: z.string().optional(),
  report: z.enum(["all", "with", "without"]).default("all"),
  measurement: z.enum(["all", "with", "without"]).default("all"),
  status: z
    .enum(["all", "new", "with balance", "without balance"])
    .default("all"),
});

type FuncParams = z.infer<typeof querySchema> & {
  managerTelegramId: number;
  managerId: string;
  userId: string;
};
type QueryFunc = (
  params: FuncParams
) => PipelineStage | PipelineStage[] | Promise<PipelineStage | PipelineStage[]>;

const getStartDate = (date: Date) => {
  const startDate = startOfDay(date);
  const zonedDate = toZonedTime(date, "Europe/Kyiv");
  const difference = date.getTime() - zonedDate.getTime();
  return new Date(startDate.getTime() + dateDifference.valueOf() + difference);
};

const queries: Record<string, QueryFunc> = {
  getBaseQuery: ({ managerTelegramId, managerId, userId }) => {
    const baseQuery =
      userId !== managerId
        ? {
            $or: [
              { "meta.managerId": managerTelegramId },
              { _id: new ObjectId(managerId) },
            ],
          }
        : { "meta.managerId": managerTelegramId };

    return {
      $match: baseQuery,
    };
  },

  getSearchQuery: ({ search }) => {
    if (!search) {
      return [];
    }

    return {
      $match: {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { "meta.firstName": { $regex: search, $options: "i" } },
          { "meta.lastName": { $regex: search, $options: "i" } },
        ],
      },
    };
  },

  getLookupMeasurementsQuery: () => [
    {
      $addFields: {
        currentUserId: { $toString: "$_id" },
      },
    },
    {
      $lookup: {
        from: "measurements",
        localField: "currentUserId",
        foreignField: "userId",
        as: "userMeasurements",
      },
    },
  ],

  getReportQuery: ({ report }) => {
    if (report === "all") {
      return [];
    }

    const todayStart = getStartDate(new Date());
    const yesterdayStart = subDays(todayStart, 1);

    const match = {
      createdAt: { $gte: yesterdayStart, $lt: todayStart },
      type: "steps",
    };

    if (report === "with") {
      return {
        $match: {
          userMeasurements: {
            $elemMatch: match,
          },
        },
      };
    } else if (report === "without") {
      return {
        $match: {
          userMeasurements: {
            $not: {
              $elemMatch: match,
            },
          },
        },
      };
    }
  },

  getMeasurementQuery: ({ measurement }) => {
    if (measurement === "all") {
      return [];
    }

    const todayStart = getStartDate(new Date());
    const yesterdayStart = subDays(todayStart, 1);

    const match = {
      createdAt: { $gte: yesterdayStart, $lt: todayStart },
      type: { $ne: "steps" },
    };

    if (measurement === "with") {
      return {
        $match: {
          userMeasurements: {
            $elemMatch: match,
          },
        },
      };
    } else if (measurement === "without") {
      return {
        $match: {
          userMeasurements: {
            $not: {
              $elemMatch: match,
            },
          },
        },
      };
    }
  },

  getMeasurementProject: () => ({
    $project: {
      privateKey: 0,
      userMeasurements: 0,
      currentUserId: 0,
    },
  }),
};

export default defineEventHandler(async (event) => {
  const validated = await zodValidateData(getQuery(event), querySchema.parse);
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

  const params = {
    ...validated,
    managerId: manager._id.toString(),
    managerTelegramId: manager.id,
    userId: userId.toString(),
  };

  const asyncAggregateQueries = Object.values(queries).map(async (query) => {
    const result = query(params);

    if (result instanceof Promise) {
      return await result;
    }

    return result;
  });
  const aggregateQueries = await Promise.all(asyncAggregateQueries);
  const aggregateQuery = aggregateQueries.reduce<PipelineStage[]>(
    (acc, query) =>
      Array.isArray(query) ? [...acc, ...query] : [...acc, query],
    []
  );

  const data = await ModelUser.aggregate(aggregateQuery);

  const { status, offset, limit } = validated;
  if (status === "all") {
    return data.slice(offset, offset + limit);
  }

  const asyncTransformedData = data.map(async (item) => {
    const wallet = await ModelWallet.findOne({
      userId: item._id,
    });
    const balance = await getBalance(wallet.privateKey);
    const transaction = await getTransactions(wallet.privateKey, { limit: 1 });
    return {
      ...item,
      balance,
      containsTransactions: transaction.length > 0,
    };
  });
  const transformedData = await Promise.all(asyncTransformedData);
  const filteredData = transformedData
    .filter((item) => {
      if (status === "new") {
        return !item.balance && !item.containsTransactions;
      }
      if (status === "with balance") {
        return item.balance > 0;
      }
      return !item.balance;
    })
    .map((item) => omit(item, ["balance", "containsTransactions"]));

  return filteredData.slice(offset, offset + limit);
});
