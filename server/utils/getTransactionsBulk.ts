import { bllsBase } from "~~/constants";

export interface TransactionsBulkRequest<
  TSymbol extends string = string,
  TLimit extends number = 100,
  TOffset extends number = 0,
  TOrder extends "asc" | "desc" = "desc",
  TOrderBy extends "timestamp" | "value" | "symbol" = "timestamp",
  TFromTimestamp extends number | undefined = undefined,
  TToTimestamp extends number | undefined = undefined,
  TValue extends number | undefined = undefined,
> {
  fromTimestamp?: TFromTimestamp;
  toTimestamp?: TToTimestamp;
  symbol?: TSymbol;
  limit?: TLimit;
  offset?: TOffset;
  order?: TOrder;
  orderBy?: TOrderBy;
  value?: TValue;
}

const getTransactionsBulk = async <
  T extends string[],
  TSymbol extends string = string,
  TLimit extends number = 100,
  TOffset extends number = 0,
  TOrder extends "asc" | "desc" = "desc",
  TOrderBy extends "timestamp" | "value" | "symbol" = "timestamp",
  TFromTimestamp extends number | undefined = undefined,
  TToTimestamp extends number | undefined = undefined,
  TValue extends number | undefined = undefined,
>(
  addresses: T,
  options: TransactionsBulkRequest<
    TSymbol,
    TLimit,
    TOffset,
    TOrder,
    TOrderBy,
    TFromTimestamp,
    TToTimestamp,
    TValue
  > = {},
) => {
  return await $fetch<{
    transactions: Record<T[number], {
      _id: string;
      from: string;
      to: string;
      symbol: TSymbol;
      timestamp: number;
      message?: string;
      value: TValue extends number ? TValue : number;
    }[]>;
    metadata: {
      totalAddresses: number;
      addressesWithTransactions: number;
      totalTransactions: number;
      limit: TLimit;
      offset: TOffset;
      order: TOrder;
      orderBy: TOrderBy;
      filters: {
        symbol: TSymbol;
        fromTimestamp: TFromTimestamp;
        toTimestamp: TToTimestamp;
        value: TValue;
      };
    };
  }>(`/billing/transactions/bulk`, {
    method: 'POST',
    baseURL: bllsBase,
    body: {
      addresses,
      ...options,
    },
    retry: 5,
    retryDelay: 1000,
  });
};

export default getTransactionsBulk;
