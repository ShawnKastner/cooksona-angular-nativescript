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
  eatenMeals: { [recipeId: string]: number }; // Maps recipeId to portions eaten
}

export interface HealthData {
  userId: string;
  bmr: number; // Basal Metabolic Rate
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
}
