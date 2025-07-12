import { Wallet } from "ethers";
import { Types } from "mongoose";

const createWallet = async (userId: Types.ObjectId) => {
  const wallet = Wallet.createRandom();
  return ModelWallet.create({
    privateKey: wallet.privateKey,
    userId,
  });
};

export default createWallet;
