export const CATEGORIES = [
  "All",
  "Work",
  "Personal",
  "Health",
  "Other",
] as const;

export type CategoryKey = (typeof CATEGORIES)[number];
