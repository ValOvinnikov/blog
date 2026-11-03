const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Takes the refused items back out of a form's values: a list drops them, a record restores their saved values. */
export const restoreRefusedItems = <TValues>(
  values: TValues,
  savedValues: TValues,
  items: string[],
): TValues => {
  if (Array.isArray(values)) {
    return values.filter((value) => !items.includes(value)) as TValues;
  }
  if (!isRecord(values) || !isRecord(savedValues)) return values;

  const restored: Record<string, unknown> = { ...values };
  for (const item of items.filter((key) => key in restored)) {
    restored[item] = savedValues[item];
  }
  return restored as TValues;
};
