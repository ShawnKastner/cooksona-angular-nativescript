export interface WorkoutTypeMeta {
  label: string;
  icon: string;
}

const DEFAULT_META: WorkoutTypeMeta = {
  label: 'Workout',
  icon: 'activity-generic',
};

// Map frequently used Apple Health workout types to localized labels and icon keys
export const WORKOUT_TYPE_MAP: Record<number, WorkoutTypeMeta> = {
  [HKWorkoutActivityType.Walking]: { label: 'Gehen', icon: 'activity-walk' },
  [HKWorkoutActivityType.Running]: { label: 'Laufen', icon: 'activity-run' },
  [HKWorkoutActivityType.Cycling]: { label: 'Radfahren', icon: 'activity-bike' },
  [HKWorkoutActivityType.Hiking]: { label: 'Wandern', icon: 'activity-hike' },
  [HKWorkoutActivityType.Swimming]: { label: 'Schwimmen', icon: 'activity-swim' },
  [HKWorkoutActivityType.TraditionalStrengthTraining]: {
    label: 'Krafttraining',
    icon: 'activity-strength',
  },
  [HKWorkoutActivityType.FunctionalStrengthTraining]: {
    label: 'Functional Strength',
    icon: 'activity-strength',
  },
  [HKWorkoutActivityType.Yoga]: { label: 'Yoga', icon: 'activity-yoga' },
  [HKWorkoutActivityType.HighIntensityIntervalTraining]: {
    label: 'HIIT',
    icon: 'activity-hiit',
  },
  [HKWorkoutActivityType.Dance]: { label: 'Tanzen', icon: 'activity-dance' },
  [HKWorkoutActivityType.MindAndBody]: { label: 'Mind & Body', icon: 'activity-mind' },
  [HKWorkoutActivityType.Pilates]: { label: 'Pilates', icon: 'activity-pilates' },
  [HKWorkoutActivityType.Rowing]: { label: 'Rudern', icon: 'activity-row' },
  [HKWorkoutActivityType.StairClimbing]: { label: 'Treppensteigen', icon: 'activity-stairs' },
  [HKWorkoutActivityType.MixedCardio]: { label: 'Cardio Mix', icon: 'activity-cardio' },
  [HKWorkoutActivityType.Cooldown]: { label: 'Cooldown', icon: 'activity-cooldown' },
  [HKWorkoutActivityType.WheelchairWalkPace]: {
    label: 'Rollstuhl (Gehtempo)',
    icon: 'activity-wheelchair',
  },
  [HKWorkoutActivityType.WheelchairRunPace]: {
    label: 'Rollstuhl (Lauftempo)',
    icon: 'activity-wheelchair',
  },
  [HKWorkoutActivityType.Other]: { label: 'Sonstige Aktivität', icon: 'activity-generic' },
};

export function mapWorkoutType(activityType: number): WorkoutTypeMeta {
  return WORKOUT_TYPE_MAP[activityType] ?? DEFAULT_META;
}
