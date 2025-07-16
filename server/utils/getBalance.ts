import { Wallet } from "ethers";

const getBalance = async (privateKey: string) => {
  const wallet = new Wallet(privateKey);
  const { nka } = await $fetch<{ nka?: number }>(`https://api.blls.me/billing/ballance/${wallet.address}`, {
    retry: 5,
    retryDelay: 1000,
  });
  return nka ?? 0;
};

export default getBalance;
