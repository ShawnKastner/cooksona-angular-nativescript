import { ActivityOption } from '@cooksona/models/health.models';

export interface ActivityCategory {
  category: string;
  activities: ActivityOption[];
}

// Beliebte/Häufige Aktivitäten
export const POPULAR_ACTIVITIES: ActivityOption[] = [
  { type: 'running', label: 'Laufen' },
  { type: 'walking', label: 'Gehen' },
  { type: 'cycling', label: 'Radfahren' },
  { type: 'swimming', label: 'Schwimmen' },
  { type: 'weightlifting', label: 'Krafttraining' },
  { type: 'yoga', label: 'Yoga' },
  { type: 'hiit', label: 'HIIT' },
  { type: 'soccer', label: 'Fußball' },
];

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    category: 'Beliebt',
    activities: POPULAR_ACTIVITIES,
  },
  {
    category: 'Ausdauer',
    activities: [
      { type: 'running', label: 'Laufen' },
      { type: 'walking', label: 'Gehen' },
      { type: 'hiking', label: 'Wandern' },
      { type: 'cycling', label: 'Radfahren' },
      { type: 'rowing', label: 'Rudern' },
      { type: 'elliptical', label: 'Crosstrainer' },
      { type: 'stairClimbing', label: 'Treppensteigen' },
      { type: 'jumpRope', label: 'Seilspringen' },
      { type: 'stairs', label: 'Treppen' },
    ],
  },
  {
    category: 'Kraft & Flexibilität',
    activities: [
      { type: 'weightlifting', label: 'Krafttraining' },
      {
        type: 'functionalStrengthTraining',
        label: 'Funktionelles Krafttraining',
      },
      { type: 'coreTraining', label: 'Core-Training' },
      { type: 'flexibility', label: 'Beweglichkeit' },
      { type: 'yoga', label: 'Yoga' },
      { type: 'pilates', label: 'Pilates' },
      { type: 'crossTraining', label: 'Cross-Training' },
      { type: 'hiit', label: 'HIIT' },
      { type: 'barre', label: 'Barre' },
      { type: 'stepTraining', label: 'Step-Training' },
    ],
  },
  {
    category: 'Wassersport',
    activities: [
      { type: 'swimming', label: 'Schwimmen' },
      { type: 'surfingSports', label: 'Surfen' },
      { type: 'paddleSports', label: 'Paddelsport' },
      { type: 'waterFitness', label: 'Wassergymnastik' },
      { type: 'waterPolo', label: 'Wasserball' },
      { type: 'waterSports', label: 'Wassersport' },
      { type: 'paddleBoarding', label: 'Stand-Up-Paddling' },
      { type: 'sailing', label: 'Segeln' },
      { type: 'underwaterDiving', label: 'Tauchen' },
    ],
  },
  {
    category: 'Wintersport',
    activities: [
      { type: 'skiing', label: 'Skifahren' },
      { type: 'downhillSkiing', label: 'Abfahrtski' },
      { type: 'crossCountrySkiing', label: 'Langlauf' },
      { type: 'snowboarding', label: 'Snowboarden' },
      { type: 'snowSports', label: 'Wintersport' },
      { type: 'iceSkating', label: 'Eislaufen' },
      { type: 'iceHockey', label: 'Eishockey' },
      { type: 'curling', label: 'Curling' },
      { type: 'snowShoeing', label: 'Schneeschuhwandern' },
    ],
  },
  {
    category: 'Mannschaftssport',
    activities: [
      { type: 'soccer', label: 'Fußball' },
      { type: 'basketball', label: 'Basketball' },
      { type: 'volleyball', label: 'Volleyball' },
      { type: 'handball', label: 'Handball' },
      { type: 'baseball', label: 'Baseball' },
      { type: 'softball', label: 'Softball' },
      { type: 'football', label: 'Football' },
      { type: 'americanFootball', label: 'American Football' },
      { type: 'australianFootball', label: 'Australian Football' },
      { type: 'rugby', label: 'Rugby' },
      { type: 'cricket', label: 'Cricket' },
      { type: 'lacrosse', label: 'Lacrosse' },
    ],
  },
  {
    category: 'Racketsport',
    activities: [
      { type: 'tennis', label: 'Tennis' },
      { type: 'tableTennis', label: 'Tischtennis' },
      { type: 'badminton', label: 'Badminton' },
      { type: 'squash', label: 'Squash' },
      { type: 'racquetball', label: 'Racquetball' },
      { type: 'pickleball', label: 'Pickleball' },
    ],
  },
  {
    category: 'Kampfsport',
    activities: [
      { type: 'boxing', label: 'Boxen' },
      { type: 'kickboxing', label: 'Kickboxen' },
      { type: 'martialArts', label: 'Kampfsport' },
      { type: 'wrestling', label: 'Ringen' },
      { type: 'fencing', label: 'Fechten' },
      { type: 'taiChi', label: 'Tai Chi' },
      { type: 'mixedCardio', label: 'Gemischtes Cardio' },
    ],
  },
  {
    category: 'Tanz',
    activities: [
      { type: 'dancing', label: 'Tanzen' },
      { type: 'socialDance', label: 'Gesellschaftstanz' },
      { type: 'cardioDance', label: 'Cardio-Tanz' },
    ],
  },
  {
    category: 'Outdoor & Natur',
    activities: [
      { type: 'hiking', label: 'Wandern' },
      { type: 'climbing', label: 'Klettern' },
      { type: 'rockClimbing', label: 'Felsklettern' },
      { type: 'equestrianSports', label: 'Reitsport' },
      { type: 'fishing', label: 'Angeln' },
      { type: 'hunting', label: 'Jagen' },
      { type: 'golf', label: 'Golf' },
    ],
  },
  {
    category: 'Mobilität & Assistenz',
    activities: [
      { type: 'wheelchairWalkPace', label: 'Rollstuhl (Gehtempo)' },
      { type: 'wheelchairRunPace', label: 'Rollstuhl (Lauftempo)' },
      { type: 'handCycling', label: 'Handbike' },
    ],
  },
  {
    category: 'Sonstiges',
    activities: [
      { type: 'skatingSports', label: 'Skate-Sport' },
      { type: 'discSports', label: 'Disc-Sport' },
      { type: 'mindAndBody', label: 'Geist & Körper' },
      { type: 'preparationAndRecovery', label: 'Vorbereitung & Erholung' },
      { type: 'fitnessGaming', label: 'Fitness-Gaming' },
      { type: 'play', label: 'Spielen' },
      { type: 'archery', label: 'Bogenschießen' },
      { type: 'bowling', label: 'Bowling' },
      { type: 'cooldown', label: 'Abwärmen' },
      { type: 'gymnastics', label: 'Turnen' },
      {
        type: 'mixedMetabolicCardioTraining',
        label: 'Gemischtes metabolisches Cardio',
      },
      { type: 'track', label: 'Leichtathletik' },
      { type: 'other', label: 'Andere' },
    ],
  },
];

// Flache Liste aller Aktivitäten (für Abwärtskompatibilität)
export const ACTIVITY_OPTIONS: ActivityOption[] = ACTIVITY_CATEGORIES.flatMap(
  (cat) => cat.activities,
).filter(
  (activity, index, self) =>
    index === self.findIndex((a) => a.type === activity.type),
);
