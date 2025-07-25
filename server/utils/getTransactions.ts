import { Wallet } from "ethers";
import { bllsBase } from "~~/constants";

const getTransactions = async (privateKey: string, options: {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
  orderBy?: '_id' | 'from' | 'to' | 'symbol' | 'timestamp' | 'message' | 'value';
} = {}) => {
  const wallet = new Wallet(privateKey);
  return await $fetch<{
      _id: string;
      from: string;
      to: string;
      symbol: string;
      timestamp: number;
      message?: string;
      value: number;
    }[]>(`/billing/transactions`, {
      baseURL: bllsBase,
      query: {
        address: wallet.address,
        symbol: 'nka',
        ...options,
      },
      retry: 5,
      retryDelay: 1000,
    });
};

export default getTransactions;
