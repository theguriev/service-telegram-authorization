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
    switchInfoId: {
      type: String,
      ref: "Switch Infos",
      required: false,
    },
    switchInfoIndex: {
      type: Number,
      required: false,
    },
    switchInfoLength: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

export default schema;
