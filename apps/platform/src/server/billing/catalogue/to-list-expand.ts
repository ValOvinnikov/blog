export const toListExpand = (paths: string[]): string[] =>
  paths.map((path) => `data.${path}`);
