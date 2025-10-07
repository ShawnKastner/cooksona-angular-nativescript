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
    // General Activities
    case 37: // HKWorkoutActivityTypeRunning
      return 'running';
    case 52: // HKWorkoutActivityTypeWalking
      return 'walking';
    case 24: // HKWorkoutActivityTypeHiking
      return 'hiking';
    case 13: // HKWorkoutActivityTypeCycling
      return 'cycling';
    case 46: // HKWorkoutActivityTypeSwimming
      return 'swimming';
    case 45: // HKWorkoutActivityTypeRowing
      return 'rowing';
    case 16: // HKWorkoutActivityTypeElliptical
      return 'elliptical';
    case 51: // HKWorkoutActivityTypeStairClimbing
      return 'stairClimbing';
    case 70: // HKWorkoutActivityTypeWheelchairWalkPace
      return 'wheelchairWalkPace';
    case 71: // HKWorkoutActivityTypeWheelchairRunPace
      return 'wheelchairRunPace';
    case 74: // HKWorkoutActivityTypeHandCycling
      return 'handCycling';

    // Strength & Flexibility
    case 50: // HKWorkoutActivityTypeTraditionalStrengthTraining
      return 'weightlifting';
    case 20: // HKWorkoutActivityTypeFunctionalStrengthTraining
      return 'functionalStrengthTraining';
    case 59: // HKWorkoutActivityTypeCoreTraining
      return 'coreTraining';
    case 17: // HKWorkoutActivityTypeFlexibility
      return 'flexibility';
    case 43: // HKWorkoutActivityTypeYoga
      return 'yoga';
    case 34: // HKWorkoutActivityTypePilates
      return 'pilates';
    case 15: // HKWorkoutActivityTypeCrossTraining
      return 'crossTraining';
    case 63: // HKWorkoutActivityTypeHighIntensityIntervalTraining
      return 'hiit';

    // Water Sports
    case 48: // HKWorkoutActivityTypeSurfingSports
      return 'surfingSports';
    case 32: // HKWorkoutActivityTypePaddleSports
      return 'paddleSports';
    case 53: // HKWorkoutActivityTypeWaterFitness
      return 'waterFitness';
    case 54: // HKWorkoutActivityTypeWaterPolo
      return 'waterPolo';
    case 55: // HKWorkoutActivityTypeWaterSports
      return 'waterSports';

    // Winter Sports
    case 19: // HKWorkoutActivityTypeDownhillSkiing
      return 'downhillSkiing';
    case 18: // HKWorkoutActivityTypeCrossCountrySkiing
      return 'crossCountrySkiing';
    case 47: // HKWorkoutActivityTypeSnowboarding
      return 'snowboarding';
    case 67: // HKWorkoutActivityTypeSnowSports
      return 'snowSports';
    case 65: // HKWorkoutActivityTypeSkatingSports
      return 'skatingSports';
    case 14: // HKWorkoutActivityTypeIceSkating
      return 'iceSkating';
    case 12: // HKWorkoutActivityTypeCurling
      return 'curling';
    case 22: // HKWorkoutActivityTypeHockey
      return 'iceHockey';

    // Team Sports
    case 9: // HKWorkoutActivityTypeSoccer
      return 'soccer';
    case 5: // HKWorkoutActivityTypeBasketball
      return 'basketball';
    case 4: // HKWorkoutActivityTypeBaseball
      return 'baseball';
    case 66: // HKWorkoutActivityTypeSoftball
      return 'softball';
    case 8: // HKWorkoutActivityTypeFootball (European)
      return 'football';
    case 1: // HKWorkoutActivityTypeAmericanFootball
      return 'americanFootball';
    case 2: // HKWorkoutActivityTypeAustralianFootball
      return 'australianFootball';
    case 38: // HKWorkoutActivityTypeRugby
      return 'rugby';
    case 58: // HKWorkoutActivityTypeVolleyball
      return 'volleyball';
    case 3: // HKWorkoutActivityTypeHandball
      return 'handball';
    case 11: // HKWorkoutActivityTypeCricket
      return 'cricket';
    case 31: // HKWorkoutActivityTypeLacrosse
      return 'lacrosse';

    // Racket Sports
    case 56: // HKWorkoutActivityTypeTennis
      return 'tennis';
    case 41: // HKWorkoutActivityTypeTableTennis
      return 'tableTennis';
    case 6: // HKWorkoutActivityTypeBadminton
      return 'badminton';
    case 44: // HKWorkoutActivityTypeSquash
      return 'squash';
    case 36: // HKWorkoutActivityTypeRacquetball
      return 'racquetball';

    // Combat Sports
    case 10: // HKWorkoutActivityTypeBoxing
      return 'boxing';
    case 30: // HKWorkoutActivityTypeKickboxing
      return 'kickboxing';
    case 33: // HKWorkoutActivityTypeMartialArts
      return 'martialArts';
    case 57: // HKWorkoutActivityTypeWrestling
      return 'wrestling';
    case 21: // HKWorkoutActivityTypeFencing
      return 'fencing';
    case 49: // HKWorkoutActivityTypeTaiChi
      return 'taiChi';
    case 35: // HKWorkoutActivityTypeMixedCardio
      return 'mixedCardio';

    // Dance & Rhythmic
    case 19: // HKWorkoutActivityTypeDance
      return 'dancing';
    case 7: // HKWorkoutActivityTypeBarre
      return 'barre';
    case 60: // HKWorkoutActivityTypeDiscSports
      return 'discSports';

    // Outdoor Activities
    case 26: // HKWorkoutActivityTypeClimbing
      return 'climbing';
    case 40: // HKWorkoutActivityTypeRockClimbing (iOS 17+)
      return 'rockClimbing';
    case 23: // HKWorkoutActivityTypeEquestrianSports
      return 'equestrianSports';
    case 61: // HKWorkoutActivityTypeFishing
      return 'fishing';
    case 25: // HKWorkoutActivityTypeHunting
      return 'hunting';
    case 27: // HKWorkoutActivityTypeGolf
      return 'golf';
    case 28: // HKWorkoutActivityTypePlay
      return 'play';

    // Motor Sports & Misc
    case 42: // HKWorkoutActivityTypePreparationAndRecovery
      return 'preparationAndRecovery';
    case 39: // HKWorkoutActivityTypeSailing
      return 'sailing';
    case 29: // HKWorkoutActivityTypeMindAndBody
      return 'mindAndBody';
    case 84: // HKWorkoutActivityTypePickleball (iOS 17+)
      return 'pickleball';

    // Fitness & Gym
    case 64: // HKWorkoutActivityTypeStepTraining
      return 'stepTraining';
    case 76: // HKWorkoutActivityTypeFitnessGaming
      return 'fitnessGaming';
    case 27: // HKWorkoutActivityTypeJumpRope
      return 'jumpRope';
    case 75: // HKWorkoutActivityTypeStairs
      return 'stairs';

    // Other specific activities
    case 3000: // HKWorkoutActivityTypeArchery (custom)
      return 'archery';
    case 3001: // HKWorkoutActivityTypeBowling (custom)
      return 'bowling';
    case 77: // HKWorkoutActivityTypeCardioDance
      return 'cardioDance';
    case 78: // HKWorkoutActivityTypeCooldown
      return 'cooldown';
    case 62: // HKWorkoutActivityTypeGymnastics
      return 'gymnastics';
    case 79: // HKWorkoutActivityTypeMixedMetabolicCardioTraining
      return 'mixedMetabolicCardioTraining';
    case 80: // HKWorkoutActivityTypePaddleBoarding (Stand-up paddling, custom)
      return 'paddleBoarding';
    case 81: // HKWorkoutActivityTypeSnowShoeing (custom)
      return 'snowShoeing';
    case 82: // HKWorkoutActivityTypeSocialDance
      return 'socialDance';
    case 83: // HKWorkoutActivityTypeTrackAndField
      return 'track';
    case 85: // HKWorkoutActivityTypeUnderwaterDiving
      return 'underwaterDiving';

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
    // General Activities
    running: 'Laufen',
    walking: 'Gehen',
    hiking: 'Wandern',
    cycling: 'Radfahren',
    swimming: 'Schwimmen',
    rowing: 'Rudern',
    elliptical: 'Crosstrainer',
    stairClimbing: 'Treppensteigen',
    wheelchairWalkPace: 'Rollstuhl (Gehtempo)',
    wheelchairRunPace: 'Rollstuhl (Lauftempo)',
    handCycling: 'Handbike',

    // Strength & Flexibility
    weightlifting: 'Krafttraining',
    functionalStrengthTraining: 'Funktionelles Krafttraining',
    coreTraining: 'Core-Training',
    flexibility: 'Beweglichkeit',
    yoga: 'Yoga',
    pilates: 'Pilates',
    crossTraining: 'Cross-Training',
    hiit: 'HIIT',

    // Water Sports
    surfingSports: 'Surfen',
    paddleSports: 'Paddelsport',
    waterFitness: 'Wassergymnastik',
    waterPolo: 'Wasserball',
    waterSports: 'Wassersport',

    // Winter Sports
    skiing: 'Skifahren',
    snowboarding: 'Snowboarden',
    snowSports: 'Wintersport',
    skating: 'Skaten',
    iceSkating: 'Eislaufen',
    curling: 'Curling',
    iceHockey: 'Eishockey',

    // Team Sports
    soccer: 'Fußball',
    basketball: 'Basketball',
    baseball: 'Baseball',
    softball: 'Softball',
    football: 'Football',
    americanFootball: 'American Football',
    australianFootball: 'Australian Football',
    rugby: 'Rugby',
    volleyball: 'Volleyball',
    handball: 'Handball',
    cricket: 'Cricket',
    lacrosse: 'Lacrosse',

    // Racket Sports
    tennis: 'Tennis',
    tableTennis: 'Tischtennis',
    badminton: 'Badminton',
    squash: 'Squash',
    racquetball: 'Racquetball',

    // Combat Sports
    boxing: 'Boxen',
    kickboxing: 'Kickboxen',
    martialArts: 'Kampfsport',
    wrestling: 'Ringen',
    fencing: 'Fechten',
    taiChi: 'Tai Chi',
    mixedCardio: 'Gemischtes Cardio',

    // Dance & Rhythmic
    dancing: 'Tanzen',
    barre: 'Barre',
    discSports: 'Disc-Sport',

    // Outdoor Activities
    climbing: 'Klettern',
    rockClimbing: 'Felsklettern',
    equestrianSports: 'Reitsport',
    fishing: 'Angeln',
    hunting: 'Jagen',
    golf: 'Golf',
    play: 'Spielen',

    // Motor Sports & Misc
    preparationAndRecovery: 'Vorbereitung & Erholung',
    sailing: 'Segeln',
    skatingSports: 'Skate-Sport',

    // Mind & Body
    mindAndBody: 'Geist & Körper',
    pickleball: 'Pickleball',

    // Fitness & Gym
    stepTraining: 'Step-Training',
    fitnessGaming: 'Fitness-Gaming',
    jumpRope: 'Seilspringen',
    stairs: 'Treppen',

    // Other
    archery: 'Bogenschießen',
    bowling: 'Bowling',
    cardioDance: 'Cardio-Tanz',
    cooldown: 'Abwärmen',
    crossCountrySkiing: 'Langlauf',
    downhillSkiing: 'Abfahrtski',
    gymnastics: 'Turnen',
    mixedMetabolicCardioTraining: 'Gemischtes metabolisches Cardio',
    paddleBoarding: 'Stand-Up-Paddling',
    snowShoeing: 'Schneeschuhwandern',
    socialDance: 'Gesellschaftstanz',
    track: 'Leichtathletik',
    underwaterDiving: 'Tauchen',
    other: 'Andere',
  };

  return labels[activityType] || 'Andere';
}
