import { ActivityType } from '@cooksona/models';

export interface WorkoutTypeMeta {
  label: string;
  icon: string;
  activityType: ActivityType;
}

const DEFAULT_META: WorkoutTypeMeta = {
  label: 'Workout',
  icon: 'activity-generic',
  activityType: 'other',
};

// Map frequently used Apple Health workout types to localized labels and icon keys
export const WORKOUT_TYPE_MAP: Record<number, WorkoutTypeMeta> = {
  [HKWorkoutActivityType.Walking]: {
    label: 'Gehen',
    icon: 'activity-walk',
    activityType: 'walking',
  },
  [HKWorkoutActivityType.Running]: {
    label: 'Laufen',
    icon: 'activity-run',
    activityType: 'running',
  },
  [HKWorkoutActivityType.Cycling]: {
    label: 'Radfahren',
    icon: 'activity-bike',
    activityType: 'cycling',
  },
  [HKWorkoutActivityType.Hiking]: {
    label: 'Wandern',
    icon: 'activity-hike',
    activityType: 'hiking',
  },
  [HKWorkoutActivityType.Swimming]: {
    label: 'Schwimmen',
    icon: 'activity-swim',
    activityType: 'swimming',
  },
  [HKWorkoutActivityType.TraditionalStrengthTraining]: {
    label: 'Krafttraining',
    icon: 'activity-strength',
    activityType: 'weightlifting',
  },
  [HKWorkoutActivityType.FunctionalStrengthTraining]: {
    label: 'Functional Strength',
    icon: 'activity-strength',
    activityType: 'weightlifting',
  },
  [HKWorkoutActivityType.Yoga]: {
    label: 'Yoga',
    icon: 'activity-yoga',
    activityType: 'yoga',
  },
  [HKWorkoutActivityType.HighIntensityIntervalTraining]: {
    label: 'HIIT',
    icon: 'activity-hiit',
    activityType: 'hiit',
  },
  [HKWorkoutActivityType.Dance]: {
    label: 'Tanzen',
    icon: 'activity-dance',
    activityType: 'dancing',
  },
  [HKWorkoutActivityType.MindAndBody]: {
    label: 'Mind & Body',
    icon: 'activity-mind',
    activityType: 'other',
  },
  [HKWorkoutActivityType.Pilates]: {
    label: 'Pilates',
    icon: 'activity-pilates',
    activityType: 'pilates',
  },
  [HKWorkoutActivityType.Rowing]: {
    label: 'Rudern',
    icon: 'activity-row',
    activityType: 'rowing',
  },
  [HKWorkoutActivityType.StairClimbing]: {
    label: 'Treppensteigen',
    icon: 'activity-stairs',
    activityType: 'other',
  },
  [HKWorkoutActivityType.MixedCardio]: {
    label: 'Cardio Mix',
    icon: 'activity-cardio',
    activityType: 'other',
  },
  [HKWorkoutActivityType.Cooldown]: {
    label: 'Cooldown',
    icon: 'activity-cooldown',
    activityType: 'other',
  },
  [HKWorkoutActivityType.WheelchairWalkPace]: {
    label: 'Rollstuhl (Gehtempo)',
    icon: 'activity-wheelchair',
    activityType: 'other',
  },
  [HKWorkoutActivityType.WheelchairRunPace]: {
    label: 'Rollstuhl (Lauftempo)',
    icon: 'activity-wheelchair',
    activityType: 'other',
  },
  [HKWorkoutActivityType.Other]: {
    label: 'Sonstige Aktivität',
    icon: 'activity-generic',
    activityType: 'other',
  },
};

export function mapWorkoutType(activityType: number): WorkoutTypeMeta {
  return WORKOUT_TYPE_MAP[activityType] ?? DEFAULT_META;
}

export function mapWorkoutTypeToActivityType(activityType: number): ActivityType {
  return mapWorkoutType(activityType).activityType;
}
