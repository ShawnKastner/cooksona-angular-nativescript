export interface HealthDashboardProps {
  healthData: HealthData;
  metrics: DailyMetrics;
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  caloriesEaten: number;
  caloriesBurned: number; // from activity
  waterIntake: number; // in ml
  protein: number; // in g
  carbs: number; // in g
  fat: number; // in g
  steps?: number; // Daily steps from Apple Health or manual tracking
  stepsKilometers?: number; // Distance in kilometers from steps
  stepsCalories?: number; // Calories burned from steps
  eatenMeals: { [recipeId: string]: number }; // Maps recipeId to portions eaten
}

export interface HealthData {
  userId: string;
  basalMetabolicRate: number; // BMR from backend
  maintenanceCalories: number; // TDEE from backend
  calorieTarget: number; // Daily calorie goal from backend
  macroTargets: {
    protein: number; // Daily protein goal in grams from backend
    carbs: number; // Daily carbs goal in grams from backend
    fat: number; // Daily fat goal in grams from backend
  };
  userProfile?: UserProfile;
  dailyMetrics: DailyMetrics[];
}

export interface UserProfile {
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  stepGoal?: number; // Daily step goal (optional, defaults to 10000)
}

export interface Activity {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: number; // Unix timestamp
  activityType: ActivityType;
  durationMinutes: number;
  caloriesBurned: number;
}

export type ActivityType =
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'walking'
  | 'weightlifting'
  | 'yoga'
  | 'pilates'
  | 'hiit'
  | 'dancing'
  | 'soccer'
  | 'basketball'
  | 'tennis'
  | 'hiking'
  | 'rowing'
  | 'boxing'
  | 'other';

export interface ActivityOption {
  type: ActivityType;
  label: string;
  icon?: string;
}

export interface NutritionalValues {
  calories: number; // kcal per 100g
  protein: number; // g per 100g
  carbs: number; // g per 100g
  fat: number; // g per 100g
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  nutritionalValues: NutritionalValues;
  servingSize?: number; // default serving size in grams
  brand?: string;
}

export type FoodCategory =
  | 'fruit'
  | 'vegetable'
  | 'meat'
  | 'fish'
  | 'dairy'
  | 'grain'
  | 'snack'
  | 'beverage'
  | 'other';

export interface TrackedMeal {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  food: Food;
  portionGrams: number;
  calculatedNutrition: NutritionalValues; // actual values based on portion
}
