import { Wallet } from "ethers";
import { bllsBase } from "~~/constants";

const getBalance = async (privateKey: string) => {
  const wallet = new Wallet(privateKey);
  const { nka } = await $fetch<{ nka?: number }>(`/billing/ballance/${wallet.address}`, {
    baseURL: bllsBase,
    retry: 5,
    retryDelay: 1000,
  });
  return nka ?? 0;
};

export default getBalance;
