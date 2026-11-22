/** Route paths. Each sport lives under its own prefix (only the NFL exists today). */
export const NFL = {
  home: '/nfl',
  predict: '/nfl/predict',
  bracket: '/nfl/bracket',
} as const;
