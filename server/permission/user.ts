import { serviceTelegramMessagesUserPermissions } from "./service-permissions";

export default [
	"wallet:daily",
	"wallet:daily-spend",
	"wallet:manager-daily",
	...serviceTelegramMessagesUserPermissions,
] as const;
