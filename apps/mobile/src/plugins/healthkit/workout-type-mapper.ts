import type { ActivityType } from '@cooksona/models/health.models';

/**
 * Maps Apple Health HKWorkoutActivityType to our ActivityType
 * See: https://developer.apple.com/documentation/healthkit/hkworkoutactivitytype
 */
export function mapWorkoutTypeToActivityType(
  hkWorkoutType: number,
): ActivityType {
  // HKWorkoutActivityType enum values
  switch (hkWorkoutType) {
    case 37: // HKWorkoutActivityTypeRunning
      return 'running';
    case 52: // HKWorkoutActivityTypeWalking
      return 'walking';
    case 13: // HKWorkoutActivityTypeCycling
      return 'cycling';
    case 46: // HKWorkoutActivityTypeSwimming
      return 'swimming';
    case 20: // HKWorkoutActivityTypeFunctionalStrengthTraining
    case 50: // HKWorkoutActivityTypeTraditionalStrengthTraining
      return 'weightlifting';
    case 43: // HKWorkoutActivityTypeYoga
      return 'yoga';
    case 34: // HKWorkoutActivityTypePilates
      return 'pilates';
    case 63: // HKWorkoutActivityTypeHighIntensityIntervalTraining
      return 'hiit';
    case 19: // HKWorkoutActivityTypeDance
      return 'dancing';
    case 9: // HKWorkoutActivityTypeSoccer
      return 'soccer';
    case 5: // HKWorkoutActivityTypeBasketball
      return 'basketball';
    case 56: // HKWorkoutActivityTypeTennis
      return 'tennis';
    case 24: // HKWorkoutActivityTypeHiking
      return 'hiking';
    case 45: // HKWorkoutActivityTypeRowing
      return 'rowing';
    case 10: // HKWorkoutActivityTypeBoxing
      return 'boxing';
    default:
      return 'other';
  }
}

/**
 * Gets a human-readable label for the workout type
 */
export function getWorkoutTypeLabel(hkWorkoutType: number): string {
  const activityType = mapWorkoutTypeToActivityType(hkWorkoutType);

  const labels: Record<ActivityType, string> = {
    running: 'Laufen',
    walking: 'Gehen',
    cycling: 'Radfahren',
    swimming: 'Schwimmen',
    weightlifting: 'Krafttraining',
    yoga: 'Yoga',
    pilates: 'Pilates',
    hiit: 'HIIT',
    dancing: 'Tanzen',
    soccer: 'Fußball',
    basketball: 'Basketball',
    tennis: 'Tennis',
    hiking: 'Wandern',
    rowing: 'Rudern',
    boxing: 'Boxen',
    other: 'Andere',
  };

  return labels[activityType] || 'Andere';
}
