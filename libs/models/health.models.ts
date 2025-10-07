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
  // General Activities
  | 'running'
  | 'walking'
  | 'hiking'
  | 'cycling'
  | 'swimming'
  | 'rowing'
  | 'elliptical'
  | 'stairClimbing'
  | 'wheelchairWalkPace'
  | 'wheelchairRunPace'
  | 'handCycling'
  // Strength & Flexibility
  | 'weightlifting'
  | 'functionalStrengthTraining'
  | 'coreTraining'
  | 'flexibility'
  | 'yoga'
  | 'pilates'
  | 'crossTraining'
  | 'hiit'
  // Water Sports
  | 'surfingSports'
  | 'paddleSports'
  | 'waterFitness'
  | 'waterPolo'
  | 'waterSports'
  // Winter Sports
  | 'skiing'
  | 'snowboarding'
  | 'snowSports'
  | 'skating'
  | 'iceSkating'
  | 'curling'
  | 'iceHockey'
  // Team Sports
  | 'soccer'
  | 'basketball'
  | 'baseball'
  | 'softball'
  | 'football'
  | 'americanFootball'
  | 'australianFootball'
  | 'rugby'
  | 'volleyball'
  | 'handball'
  | 'cricket'
  | 'lacrosse'
  // Racket Sports
  | 'tennis'
  | 'tableTennis'
  | 'badminton'
  | 'squash'
  | 'racquetball'
  // Combat Sports
  | 'boxing'
  | 'kickboxing'
  | 'martialArts'
  | 'wrestling'
  | 'fencing'
  | 'taiChi'
  | 'mixedCardio'
  // Dance & Rhythmic
  | 'dancing'
  | 'barre'
  | 'discSports'
  // Outdoor Activities
  | 'climbing'
  | 'rockClimbing'
  | 'equestrianSports'
  | 'fishing'
  | 'hunting'
  | 'golf'
  | 'play'
  // Motor Sports
  | 'preparationAndRecovery'
  | 'sailing'
  | 'skatingSports'
  // Mind & Body
  | 'mindAndBody'
  | 'pickleball'
  // Fitness & Gym
  | 'stepTraining'
  | 'fitnessGaming'
  | 'jumpRope'
  | 'stairs'
  // Other
  | 'archery'
  | 'bowling'
  | 'cardioDance'
  | 'cooldown'
  | 'crossCountrySkiing'
  | 'downhillSkiing'
  | 'gymnastics'
  | 'mixedMetabolicCardioTraining'
  | 'paddleBoarding'
  | 'snowShoeing'
  | 'socialDance'
  | 'track'
  | 'underwaterDiving'
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
