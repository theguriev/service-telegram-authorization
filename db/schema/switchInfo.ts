import { Schema } from "mongoose";

const schema = new Schema(
	{
		userId: {
			type: String,
			required: true,
			ref: "Users",
		},
		users: [
			{
				type: String,
				ref: "Users",
				required: true,
			},
		],
		usersRequest: {
			type: Map,
			of: Schema.Types.Mixed,
			required: true,
		},
	},
	{ timestamps: true },
);

export default schema;
