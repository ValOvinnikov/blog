export const countLabel = (
  items: unknown,
  singular: string,
  plural = `${singular}s`,
): string => {
  const count = Array.isArray(items) ? items.length : 0;

  return `${String(count)} ${count === 1 ? singular : plural}`;
};
