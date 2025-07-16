import { Wallet } from "ethers";

const sendTransaction = async (fromPrivateKey: string, toPrivateKey: string, value: number, message?: string) => {
  const fromWallet = new Wallet(fromPrivateKey);
  const toWallet = new Wallet(toPrivateKey);

  const transaction = {
    from: fromWallet.address,
    to: toWallet.address,
    value,
    symbol: 'nka',
  };

  const signature = await fromWallet.signMessage(JSON.stringify(transaction));
  await $fetch('https://api.blls.me/billing/transactions', {
    retry: 5,
    retryDelay: 1000,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      ...transaction,
      message,
      signature,
    }
  });
};

export default sendTransaction;
