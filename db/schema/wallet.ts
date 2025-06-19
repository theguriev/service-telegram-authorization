import { Schema, Types } from "mongoose";

const schema = new Schema(
  {
    privateKey: String,
    userId: Types.ObjectId,
  },
  { timestamps: true }
);

export default schema;
