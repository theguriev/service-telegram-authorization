export const serviceVideosAdminPermissions = [
	"can-upload-video",
	"can-delete-video",
] as const;

export const serviceTelegramMessagesManagerPermissions = [
	"show-managed-users-in-inline-queries",
] as const;
export const serviceTelegramMessagesAdminExtras = [
	"show-all-users-in-inline-queries",
] as const;
export const serviceTelegramMessagesUserPermissions = [
	"notification:didnt-send",
	"notification:report-reminder",
] as const;

export const serviceMeasurementsManagerPermissions = [
	"get-all-measurements",
	"update-all-measurements",
] as const;

export const serviceMealsManagerPermissions = [
	"get-all-meals",
	"get-all-categories",
	"get-all-ingredients",
	"get-template-meals",
	"apply-templates",
	"remove-templates",
	"get-all-templates",
	"create-meals",
	"create-categories",
	"create-ingredients",
	"update-meals",
	"update-categories",
	"update-ingredients",
	"delete-meals",
	"delete-categories",
	"delete-ingredients",
] as const;
export const serviceMealsTemplateManagerExtras = [
	"create-templates",
	"remove-templates",
	"delete-templates",
	"update-templates",
	"create-template-meals",
	"delete-template-meals",
	"update-template-meals",
	"create-template-categories",
	"delete-template-categories",
	"update-template-categories",
	"create-template-ingredients",
	"delete-template-ingredients",
	"update-template-ingredients",
] as const;
export const serviceMealsAdminExtras = [
	"delete-all-meals",
	"update-all-meals",
	"delete-all-categories",
	"update-all-categories",
	"delete-all-ingredients",
	"update-all-ingredients",
] as const;

export const serviceRecipesManagerPermissions = [
	"get-all-templates",
	"apply-templates",
	"remove-templates",
	"create-templates",
	"create-recipes",
	"update-recipes",
	"delete-recipes",
] as const;
export const serviceRecipesTemplateManagerExtras = [
	"delete-templates",
	"update-templates",
] as const;
export const serviceRecipesAdminExtras = [
	"remove-templates",
	"create-recipes",
	"update-recipes",
	"delete-recipes",
] as const;
