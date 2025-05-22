import { Schema } from "mongoose";

const schema = new Schema(
  {
    token: String,
    userId: String,
  },
  { timestamps: true }
);

export default schema;
