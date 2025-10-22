import { bllsBase } from "~~/constants";

export interface TransactionsRequest<
  TSymbol extends string = string
> {
  address?: string;
  from?: number;
  to?: number;
  fromAddress?: string;
  toAddress?: string;
  symbol?: TSymbol;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
  orderBy?: '_id' | 'from' | 'to' | 'symbol' | 'timestamp' | 'message' | 'value';
};

const getTransactions = async <TSymbol extends string = string>(options: TransactionsRequest<TSymbol> = {}) => {
  return await $fetch<{
      _id: string;
      from: string;
      to: string;
      symbol: TSymbol;
      timestamp: number;
      message?: string;
      value: number;
    }[]>(`/billing/transactions`, {
      baseURL: bllsBase,
      query: options,
      retry: 5,
      retryDelay: 1000,
    });
};

export default getTransactions;
