export const Colors = {
  // Primary
  primary: '#245C43',

  // Backgrounds
  backgroundWarm: '#FAF8F3',
  backgroundWhite: '#FFFFFF',
  backgroundSage: '#DCE9DD',

  // Text
  textPrimary: '#202820',
  textSecondary: '#858B82',

  // Accent
  accent: '#E9A45B',

  // Functional
  success: '#27845A',
  warning: '#D99A35',
  error: '#C94B4B',
  info: '#477FA8',

  // Utility aliases (keep names intentional)
  surface: '#FFFFFF',
  chip: '#DCE9DD',
  border: '#E0E8E1',
  divider: '#EEF0EC',
  overlay: 'rgba(32, 40, 32, 0.4)',
  shadow: 'rgba(36, 92, 67, 0.08)',

  // Cuisine Card Accents (controlled palette)
  cuisineIndian: '#C8906A',
  cuisineItalian: '#7DA87B',
  cuisineMexican: '#D4A843',
  cuisineAsian: '#7B9EBC',
  cuisineMediterranean: '#9B8EC4',
  cuisineDefault: '#A8B5A0',
} as const;

export type ColorKey = keyof typeof Colors;
