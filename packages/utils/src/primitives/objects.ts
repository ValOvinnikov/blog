/**
 * Typed `Object.keys`: preserves `keyof T` instead of widening to `string[]`.
 * Handy for deriving option lists from an object (e.g. Storybook arg dropdowns
 * from a `tailwind-variants` config).
 */
export const objectKeys = <T extends object>(obj: T): Array<keyof T> =>
  Object.keys(obj) as Array<keyof T>;

// Assumes SCREAMING_SNAKE_CASE input (this repo's UPPERCASE const-value convention).
export const toTitleCase = (value: string): string =>
  value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
