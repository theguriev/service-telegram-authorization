import { Wallet } from "ethers";
import { Types } from "mongoose";
import sendTransaction from "./sendTransaction";

const createWallet = async (userId: Types.ObjectId, walletPrivateKey: string) => {
  let walletModel = await ModelWallet.findOne({ userId });
  if (!walletModel) {
    const wallet = Wallet.createRandom();
    walletModel = await ModelWallet.create({
      privateKey: wallet.privateKey,
      userId,
    });

    await sendTransaction(walletPrivateKey, wallet.privateKey, 61, 'Initial wallet funding');
  }
  return walletModel;
};

export default createWallet;
