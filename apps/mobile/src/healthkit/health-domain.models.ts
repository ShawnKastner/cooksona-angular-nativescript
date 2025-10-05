export interface ActivitySummary {
  dateISO: string;
  steps: number;
  distanceKm: number;
  activeKcal: number;
  goalSteps: number;
  progress01: number;
}

export type WorkoutSource = 'apple_health' | 'other';

export interface Workout {
  id: string;
  activityType: number;
  activityLabel: string;
  start: Date;
  end: Date;
  durationSec: number;
  distanceKm?: number;
  activeKcal?: number;
  source: WorkoutSource;
}
