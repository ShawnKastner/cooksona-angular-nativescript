import type { DailyMetrics, HealthData } from './health.models';

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
  date: Date
): DailyMetrics {
  const dateStr = getDateString(date);
  const metrics = healthData.dailyMetrics.find((m) => m.date === dateStr);
  return metrics || { ...getDefaultMetrics(), date: dateStr, eatenMeals: {} };
}
