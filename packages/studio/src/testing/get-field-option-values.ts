type TFieldWithOptions = { options?: unknown };

/**
 * Reads each `options.list` entry's `value`, in order — the values a
 * radio/dropdown field actually offers.
 */
export const getOptionValues = (field: TFieldWithOptions): string[] => {
  const options = field.options;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? (options as { list?: unknown }).list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};
