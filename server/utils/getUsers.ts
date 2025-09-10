import { startOfDay, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { EventHandlerRequest, H3Event } from "h3";
import { ObjectId } from "mongodb";
import { PipelineStage } from "mongoose";
import { z } from "zod";
import { dateDifference, weekends } from "~~/constants";

export const usersRequestSchema = z.object({
  offset: z.coerce.number().int().default(0),
  limit: z.coerce.number().int().default(10),
  search: z.string().optional(),
  report: z.enum(["all", "with", "without"]).default("all"),
  measurement: z.enum(["all", "with", "without"]).default("all"),
  status: z
    .enum(["all", "new", "with balance", "without balance"])
    .default("all"),
  archived: z.coerce.boolean().default(false),
});

type FuncParams = z.infer<typeof usersRequestSchema> & {
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

  getArchivedQuery: ({ archived }) => {
    if (!archived) {
      return {
        $match: {
          $or: [
            { "meta.archived": { $exists: false } },
            { "meta.archived": false }
          ]
        }
      }
    }

    return {
      $match: {
        "meta.archived": true
      }
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
        let: { checkedDate: "$meta.checkedDate" },
        pipeline: [
          {
            $addFields: {
              notChecked: {
                $or: [
                  { $eq: [{ $type: "$$checkedDate" }, "missing"] },
                  { $eq: ["$$checkedDate", null] },
                  { $gte: ["$createdAt", { $toDate: "$$checkedDate" }] },
                ]
              }
            }
          }
        ],
        as: "userMeasurements",
      },
    },
  ],

  getReportQuery: ({ report }) => {
    if (report === "all") {
      return [];
    }

    const todayStart = getStartDate(new Date());
    let startDate = subDays(todayStart, 1);
    if (weekends.some(weekend => toZonedTime(startDate, "Europe/Kyiv").getDay() === weekend)) {
      startDate = subDays(startDate, 1);
    }

    const match = {
      createdAt: { $gte: startDate, $lt: todayStart },
      type: "steps",
    };

    if (report === "with") {
      return {
        $match: {
          userMeasurements: {
            $elemMatch: {
              ...match,
              notChecked: true
            },
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
    let startDate = subDays(todayStart, 1);
    if (weekends.some(weekend => toZonedTime(startDate, "Europe/Kyiv").getDay() === weekend)) {
      startDate = subDays(startDate, 1);
    }

    const match = {
      createdAt: { $gte: startDate, $lt: todayStart },
      type: { $ne: "steps" },
    };

    if (measurement === "with") {
      return {
        $match: {
          userMeasurements: {
            $elemMatch: {
              ...match,
              notChecked: true
            },
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

const getUsers = async (currencySymbol: string, userId: string, event: H3Event<EventHandlerRequest>, validated: z.infer<typeof usersRequestSchema>, withOffsets: boolean = true) => {
  const role = await getUserRole(event);
  const initialId = await getId(event);

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
    return withOffsets ? data.slice(offset, offset + limit) : data;
  }

  const balances = await getBalance(data.map(user => user.address), currencySymbol);
  const asyncTransformedData = data.map(async (item) => {
    const balance = balances[item.address];
    const transaction = await getTransactions(item.address, currencySymbol, { limit: 1 });
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

  return withOffsets ? filteredData.slice(offset, offset + limit) : filteredData;
};

export default getUsers;
