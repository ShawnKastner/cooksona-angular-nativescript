import { Soup, Sandwich, Utensils, Cookie } from '@cooksona/constants/icons';

export type MealTypeKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export const MEAL_TYPE_CONFIG: Record<
  MealTypeKey,
  { label: string; icon: string }
> = {
  breakfast: {
    label: 'Frühstück',
    icon: Soup,
  },
  lunch: {
    label: 'Mittagessen',
    icon: Sandwich,
  },
  dinner: {
    label: 'Abendessen',
    icon: Utensils,
  },
  snacks: {
    label: 'Snacks',
    icon: Cookie,
  },
};

export const MEAL_TYPE_ORDER: MealTypeKey[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snacks',
];
