import permissionManager from "./manager";
import {
	serviceMealsTemplateManagerExtras,
	serviceRecipesTemplateManagerExtras,
} from "./service-permissions";

export default [
	...permissionManager,
	...serviceMealsTemplateManagerExtras,
	...serviceRecipesTemplateManagerExtras,
] as const;
