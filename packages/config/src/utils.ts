export type TValueOf<Obj> = Obj[keyof Obj];

/**
 * Typed `Object.keys`: preserves `keyof T` instead of widening to `string[]`.
 * Handy for deriving option lists from an object (e.g. Storybook arg dropdowns
 * from a `tailwind-variants` config).
 */
export const objectKeys = <T extends object>(obj: T): Array<keyof T> =>
  Object.keys(obj) as Array<keyof T>;
