import { Wallet } from "ethers";
import { Types } from "mongoose";

const createWallet = async (userId: Types.ObjectId) => {
  let walletModel = await ModelWallet.findOne({ userId });
  if (!walletModel) {
    const wallet = Wallet.createRandom();
    walletModel = await ModelWallet.create({
      privateKey: wallet.privateKey,
      userId,
    });
  }
  return walletModel;
};

export default createWallet;
