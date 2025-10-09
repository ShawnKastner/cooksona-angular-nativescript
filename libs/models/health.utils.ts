import type { DailyMetrics, HealthData } from './health.models';
import { ACTIVITY_OPTIONS } from '@cooksona/constants/activities';

export function getTodayDateString(): string {
  return getDateString(new Date());
}

export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultMetrics(): DailyMetrics {
  return {
    date: getTodayDateString(),
    caloriesEaten: 0,
    caloriesBurned: 0,
    waterIntake: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    eatenMeals: {},
  };
}

export function getTodaysMetrics(healthData: HealthData): DailyMetrics {
  const todayStr = getTodayDateString();
  const metrics = healthData.dailyMetrics.find((m) => m.date === todayStr);
  return metrics || getDefaultMetrics();
}

export function getMetricsForDate(
  healthData: HealthData,
  date: Date,
): DailyMetrics {
  const dateStr = getDateString(date);
  const metrics = healthData.dailyMetrics.find((m) => m.date === dateStr);
  return metrics || { ...getDefaultMetrics(), date: dateStr, eatenMeals: {} };
}

/**
 * Berechnet die verbrannten Kalorien basierend auf MET-Wert, Körpergewicht und Dauer
 * Formel: Kalorien = MET × Gewicht (kg) × Dauer (Stunden)
 *
 * @param activityType Der Typ der Aktivität
 * @param durationMinutes Dauer der Aktivität in Minuten
 * @param weightKg Körpergewicht in Kilogramm
 * @returns Verbrannte Kalorien (gerundet)
 */
export function calculateCaloriesBurned(
  activityType: string,
  durationMinutes: number,
  weightKg: number,
): number {
  // Finde die Aktivität und hole den MET-Wert
  const activity = ACTIVITY_OPTIONS.find((opt) => opt.type === activityType);
  const met = activity?.met || 5.0; // Default MET falls nicht gefunden

  // Berechne Kalorien: MET × Gewicht (kg) × Dauer (Stunden)
  const durationHours = durationMinutes / 60;
  const calories = met * weightKg * durationHours;

  return Math.round(calories);
}

/**
 * Holt den MET-Wert für eine bestimmte Aktivität
 *
 * @param activityType Der Typ der Aktivität
 * @returns MET-Wert oder 5.0 als Default
 */
export function getMetValueForActivity(activityType: string): number {
  const activity = ACTIVITY_OPTIONS.find((opt) => opt.type === activityType);
  return activity?.met || 5.0;
}
