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

// Notification Settings
export enum ReminderType {
  FIXED_TIMES = 'fixed_times',
  INTERVAL = 'interval',
}

export enum Weekday {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export interface WaterReminderTime {
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface QuietHours {
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

export interface WaterReminderConfig {
  enabled: boolean;
  paused?: boolean;
  reminderType: ReminderType;
  // For fixed times
  fixedTimes?: WaterReminderTime[];
  // For interval-based
  intervalHours?: number; // e.g., 2, 3, 4
  intervalStartHour?: number; // e.g., 7 (7am)
  intervalStartMinute?: number; // e.g., 0
  intervalEndHour?: number; // e.g., 22 (10pm)
  intervalEndMinute?: number; // e.g., 0
  // Common settings
  activeWeekdays?: Weekday[];
  quietHours?: QuietHours;
  maxRemindersPerDay?: number;
  waterGoalMl?: number; // Daily water goal in ml
}

export interface NotificationSettings {
  id?: string;
  userId?: string;
  waterReminder?: WaterReminderConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNotificationSettingsDto {
  waterReminder?: WaterReminderConfig;
}

export interface UpdateNotificationSettingsDto {
  waterReminder?: WaterReminderConfig;
}
