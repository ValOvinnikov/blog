export const isSameJson = <T>(a: T, b: T): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
