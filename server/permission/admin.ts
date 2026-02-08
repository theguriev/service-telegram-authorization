import permissionTemplateManager from "./template-manager";
import {
	serviceMealsAdminExtras,
	serviceRecipesAdminExtras,
	serviceTelegramMessagesAdminExtras,
	serviceVideosAdminPermissions,
} from "./service-permissions";

export default [
	...permissionTemplateManager,
	...serviceVideosAdminPermissions,
	...serviceMealsAdminExtras,
	...serviceRecipesAdminExtras,
	...serviceTelegramMessagesAdminExtras,
	"get-all-users",
	"get-all-users-balance",
	"continue-all-users-subscription",
	"get-all-users-transactions",
	"update-all-users-meta",
	"update-all-users-feature-flags",
	"can-upload-video",
	"can-delete-video",
] as const;
