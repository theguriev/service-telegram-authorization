import { Schema } from "mongoose";

const schema = new Schema(
  {
    token: String,
    userId: String,
    id: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      default: "user",
      required: true,
    },
  },
  { timestamps: true }
);

export default schema;
