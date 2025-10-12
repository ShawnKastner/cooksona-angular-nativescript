// Enums
export enum PreferredMeal {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACKS = 'snacks',
}

export enum KitchenEquipment {
  AIRFRYER = 'airfryer',
  MICROWAVE = 'microwave',
  BLENDER = 'blender',
  FOOD_PROCESSOR = 'foodprocessor',
  PRESSURE_COOKER = 'pressurecooker',
  SLOW_COOKER = 'slowcooker',
}

// Nutrition Settings
export interface NutritionSettings {
  id?: string;
  userId?: string;
  dietWishes?: string;
  allergies?: string;
  personCount?: number;
  preferredMeals?: PreferredMeal[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNutritionSettingsDto {
  dietWishes?: string;
  allergies?: string;
  personCount?: number;
  preferredMeals?: PreferredMeal[];
}

export interface UpdateNutritionSettingsDto {
  dietWishes?: string;
  allergies?: string;
  personCount?: number;
  preferredMeals?: PreferredMeal[];
}

// Plan Personalization
export interface PlanPersonalization {
  id?: string;
  userId?: string;
  favoriteIngredients?: string[];
  excludedIngredients?: string[];
  kitchenEquipment?: KitchenEquipment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePlanPersonalizationDto {
  favoriteIngredients?: string[];
  excludedIngredients?: string[];
  kitchenEquipment?: KitchenEquipment[];
}

export interface UpdatePlanPersonalizationDto {
  favoriteIngredients?: string[];
  excludedIngredients?: string[];
  kitchenEquipment?: KitchenEquipment[];
}
