import { ActivityOption } from '@cooksona/models/health.models';

export interface ActivityCategory {
  category: string;
  activities: ActivityOption[];
}

// Beliebte/Häufige Aktivitäten
export const POPULAR_ACTIVITIES: ActivityOption[] = [
  { type: 'running', label: 'Laufen', met: 8.0 },
  { type: 'walking', label: 'Gehen', met: 3.5 },
  { type: 'cycling', label: 'Radfahren', met: 6.8 },
  { type: 'swimming', label: 'Schwimmen', met: 7.0 },
  { type: 'weightlifting', label: 'Krafttraining', met: 6.0 },
  { type: 'yoga', label: 'Yoga', met: 3.0 },
  { type: 'hiit', label: 'HIIT', met: 8.0 },
  { type: 'soccer', label: 'Fußball', met: 7.0 },
];

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    category: 'Beliebt',
    activities: POPULAR_ACTIVITIES,
  },
  {
    category: 'Ausdauer',
    activities: [
      { type: 'running', label: 'Laufen', met: 8.0 },
      { type: 'walking', label: 'Gehen', met: 3.5 },
      { type: 'hiking', label: 'Wandern', met: 6.0 },
      { type: 'cycling', label: 'Radfahren', met: 6.8 },
      { type: 'rowing', label: 'Rudern', met: 6.0 },
      { type: 'elliptical', label: 'Crosstrainer', met: 5.0 },
      { type: 'stairClimbing', label: 'Treppensteigen', met: 8.0 },
      { type: 'jumpRope', label: 'Seilspringen', met: 11.0 },
      { type: 'stairs', label: 'Treppen', met: 8.0 },
    ],
  },
  {
    category: 'Kraft & Flexibilität',
    activities: [
      { type: 'weightlifting', label: 'Krafttraining', met: 6.0 },
      {
        type: 'functionalStrengthTraining',
        label: 'Funktionelles Krafttraining',
        met: 5.0,
      },
      { type: 'coreTraining', label: 'Core-Training', met: 3.8 },
      { type: 'flexibility', label: 'Beweglichkeit', met: 2.5 },
      { type: 'yoga', label: 'Yoga', met: 3.0 },
      { type: 'pilates', label: 'Pilates', met: 3.0 },
      { type: 'crossTraining', label: 'Cross-Training', met: 5.0 },
      { type: 'hiit', label: 'HIIT', met: 8.0 },
      { type: 'barre', label: 'Barre', met: 4.0 },
      { type: 'stepTraining', label: 'Step-Training', met: 8.5 },
    ],
  },
  {
    category: 'Wassersport',
    activities: [
      { type: 'swimming', label: 'Schwimmen', met: 7.0 },
      { type: 'surfingSports', label: 'Surfen', met: 3.0 },
      { type: 'paddleSports', label: 'Paddelsport', met: 6.0 },
      { type: 'waterFitness', label: 'Wassergymnastik', met: 5.3 },
      { type: 'waterPolo', label: 'Wasserball', met: 10.0 },
      { type: 'waterSports', label: 'Wassersport', met: 5.0 },
      { type: 'paddleBoarding', label: 'Stand-Up-Paddling', met: 6.0 },
      { type: 'sailing', label: 'Segeln', met: 3.0 },
      { type: 'underwaterDiving', label: 'Tauchen', met: 7.0 },
    ],
  },
  {
    category: 'Wintersport',
    activities: [
      { type: 'skiing', label: 'Skifahren', met: 7.0 },
      { type: 'downhillSkiing', label: 'Abfahrtski', met: 5.3 },
      { type: 'crossCountrySkiing', label: 'Langlauf', met: 9.0 },
      { type: 'snowboarding', label: 'Snowboarden', met: 5.3 },
      { type: 'snowSports', label: 'Wintersport', met: 5.3 },
      { type: 'iceSkating', label: 'Eislaufen', met: 7.0 },
      { type: 'iceHockey', label: 'Eishockey', met: 8.0 },
      { type: 'curling', label: 'Curling', met: 4.0 },
      { type: 'snowShoeing', label: 'Schneeschuhwandern', met: 5.3 },
    ],
  },
  {
    category: 'Mannschaftssport',
    activities: [
      { type: 'soccer', label: 'Fußball', met: 7.0 },
      { type: 'basketball', label: 'Basketball', met: 6.5 },
      { type: 'volleyball', label: 'Volleyball', met: 4.0 },
      { type: 'handball', label: 'Handball', met: 8.0 },
      { type: 'baseball', label: 'Baseball', met: 5.0 },
      { type: 'softball', label: 'Softball', met: 5.0 },
      { type: 'football', label: 'Football', met: 8.0 },
      { type: 'americanFootball', label: 'American Football', met: 8.0 },
      { type: 'australianFootball', label: 'Australian Football', met: 8.0 },
      { type: 'rugby', label: 'Rugby', met: 8.3 },
      { type: 'cricket', label: 'Cricket', met: 4.8 },
      { type: 'lacrosse', label: 'Lacrosse', met: 8.0 },
    ],
  },
  {
    category: 'Racketsport',
    activities: [
      { type: 'tennis', label: 'Tennis', met: 7.3 },
      { type: 'tableTennis', label: 'Tischtennis', met: 4.0 },
      { type: 'badminton', label: 'Badminton', met: 5.5 },
      { type: 'squash', label: 'Squash', met: 7.3 },
      { type: 'racquetball', label: 'Racquetball', met: 7.0 },
      { type: 'pickleball', label: 'Pickleball', met: 6.0 },
    ],
  },
  {
    category: 'Kampfsport',
    activities: [
      { type: 'boxing', label: 'Boxen', met: 9.0 },
      { type: 'kickboxing', label: 'Kickboxen', met: 10.0 },
      { type: 'martialArts', label: 'Kampfsport', met: 10.3 },
      { type: 'wrestling', label: 'Ringen', met: 6.0 },
      { type: 'fencing', label: 'Fechten', met: 6.0 },
      { type: 'taiChi', label: 'Tai Chi', met: 3.0 },
      { type: 'mixedCardio', label: 'Gemischtes Cardio', met: 6.8 },
    ],
  },
  {
    category: 'Tanz',
    activities: [
      { type: 'dancing', label: 'Tanzen', met: 4.8 },
      { type: 'socialDance', label: 'Gesellschaftstanz', met: 5.5 },
      { type: 'cardioDance', label: 'Cardio-Tanz', met: 6.5 },
    ],
  },
  {
    category: 'Outdoor & Natur',
    activities: [
      { type: 'hiking', label: 'Wandern', met: 6.0 },
      { type: 'climbing', label: 'Klettern', met: 8.0 },
      { type: 'rockClimbing', label: 'Felsklettern', met: 8.0 },
      { type: 'equestrianSports', label: 'Reitsport', met: 5.5 },
      { type: 'fishing', label: 'Angeln', met: 3.5 },
      { type: 'hunting', label: 'Jagen', met: 5.0 },
      { type: 'golf', label: 'Golf', met: 4.8 },
    ],
  },
  {
    category: 'Mobilität & Assistenz',
    activities: [
      { type: 'wheelchairWalkPace', label: 'Rollstuhl (Gehtempo)', met: 2.0 },
      { type: 'wheelchairRunPace', label: 'Rollstuhl (Lauftempo)', met: 5.0 },
      { type: 'handCycling', label: 'Handbike', met: 5.0 },
    ],
  },
  {
    category: 'Sonstiges',
    activities: [
      { type: 'skatingSports', label: 'Skate-Sport', met: 7.0 },
      { type: 'discSports', label: 'Disc-Sport', met: 4.0 },
      { type: 'mindAndBody', label: 'Geist & Körper', met: 2.5 },
      {
        type: 'preparationAndRecovery',
        label: 'Vorbereitung & Erholung',
        met: 2.3,
      },
      { type: 'fitnessGaming', label: 'Fitness-Gaming', met: 3.8 },
      { type: 'play', label: 'Spielen', met: 5.0 },
      { type: 'archery', label: 'Bogenschießen', met: 4.3 },
      { type: 'bowling', label: 'Bowling', met: 3.0 },
      { type: 'cooldown', label: 'Abwärmen', met: 2.3 },
      { type: 'gymnastics', label: 'Turnen', met: 4.0 },
      {
        type: 'mixedMetabolicCardioTraining',
        label: 'Gemischtes metabolisches Cardio',
        met: 6.5,
      },
      { type: 'track', label: 'Leichtathletik', met: 6.0 },
      { type: 'other', label: 'Andere', met: 5.0 },
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
