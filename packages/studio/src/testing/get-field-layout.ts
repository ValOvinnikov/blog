/**
 * Reads a field's `options.layout` — the radio/dropdown choice behind an
 * `options.list` control.
 */
export const getLayout = (field: { options?: unknown }): string | undefined => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};
