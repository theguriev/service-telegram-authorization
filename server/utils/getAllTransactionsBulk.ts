import { TransactionsBulkRequest } from "./getTransactionsBulk";

const getAllTransactionsBulk = async <
  T extends string[],
  TSymbol extends string = string,
  TLimit extends number = 100,
  TOrder extends "asc" | "desc" = "desc",
  TOrderBy extends "timestamp" | "value" | "symbol" = "timestamp",
  TFromTimestamp extends number | undefined = undefined,
  TToTimestamp extends number | undefined = undefined,
  TValue extends number | undefined = undefined,
>(
  addresses: T,
  options: Omit<
    TransactionsBulkRequest<
      TSymbol,
      TLimit,
      0,
      TOrder,
      TOrderBy,
      TFromTimestamp,
      TToTimestamp,
      TValue
    >,
    "offset"
  > = {},
) => {
  type DefaultResponse = Awaited<
    ReturnType<
      typeof getTransactionsBulk<
        T,
        TSymbol,
        TLimit,
        0,
        TOrder,
        TOrderBy,
        TFromTimestamp,
        TToTimestamp,
        TValue
      >
    >
  >;
  type Response = Omit<DefaultResponse, "metadata"> & {
    metadata: Omit<DefaultResponse["metadata"], "offset">;
  };

  const step = (options.limit ?? 100) as TLimit;

  let transactions: Response = {
    transactions: addresses.reduce(
      (acc, address) => ({
        ...acc,
        [address]: [],
      }),
      {} as Response["transactions"],
    ),
    metadata: {
      totalAddresses: addresses.length,
      totalTransactions: 0,
      addressesWithTransactions: 0,
      limit: step,
      order: (options.order ?? "desc") as TOrder,
      orderBy: (options.orderBy ?? "timestamp") as TOrderBy,
      filters: {
        symbol: options.symbol,
        fromTimestamp: options.fromTimestamp,
        toTimestamp: options.toTimestamp,
        value: options.value,
      },
    },
  };

  for (
    let offset = 0;
    transactions.metadata.totalTransactions === offset;
    offset += step
  ) {
    const nextTransactions = await getTransactionsBulk(addresses, {
      ...options,
      limit: step,
      offset,
    });
    transactions.transactions = addresses.reduce(
      (acc, address) => ({
        ...acc,
        [address]: [...acc[address], ...nextTransactions.transactions[address]],
      }),
      transactions.transactions,
    );
    transactions.metadata.totalTransactions +=
      nextTransactions.metadata.totalTransactions;
  }

  transactions.metadata.addressesWithTransactions = Object.values<
    Response["transactions"][T[number]]
  >(transactions.transactions).filter((item) => item.length > 0).length;

  return transactions;
};

export default getAllTransactionsBulk;
