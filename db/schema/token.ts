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
		os: {
			type: String,
			enum: ["windows", "linux", "macos", "android", "ios", "web"],
			required: true,
		},
		source: {
			type: String,
			required: true,
		},
		application: {
			type: String,
			required: true,
		},
		fingerprint: {
			type: String,
			required: true,
		},
		ipAddress: {
			type: String,
			required: true,
		},
		expiresIn: {
			type: Date,
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
	{ timestamps: true },
);

export default schema;
