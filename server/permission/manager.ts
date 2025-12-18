import {
	serviceMealsManagerPermissions,
	serviceMeasurementsManagerPermissions,
	serviceRecipesManagerPermissions,
	serviceTelegramMessagesManagerPermissions,
} from "./service-permissions";

export default [
	"get-managed-users",
	"get-managed-users-balance",
	"continue-managed-users-subscription",
	"get-managed-users-transactions",
	"update-managed-users-meta",
	"update-managed-users-feature-flags",
	"switch-user",
	"switch-previous-user",
	"switch-next-user",
	...serviceMealsManagerPermissions,
	...serviceMeasurementsManagerPermissions,
	...serviceRecipesManagerPermissions,
	...serviceTelegramMessagesManagerPermissions,
] as const;
