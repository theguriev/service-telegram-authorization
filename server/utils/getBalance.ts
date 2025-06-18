import { Wallet } from "ethers";

const getBalance = async (privateKey: string) => {
  const wallet = new Wallet(privateKey);
  const { nka } = await $fetch<{ nka?: number }>(`http://api.blls.me:3000/billing/ballance/${wallet.address}`, {
    retry: 5,
    retryDelay: 1000,
  });
  return nka ?? 0;
};

export default getBalance;
