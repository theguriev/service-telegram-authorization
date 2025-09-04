import { bllsBase } from "~~/constants";

const getBalance = async (address: string) => {
  const { nka } = await $fetch<{ nka?: number }>(`/billing/ballance/${address}`, {
    baseURL: bllsBase,
    retry: 5,
    retryDelay: 1000,
  });
  return nka ?? 0;
};

export default getBalance;
