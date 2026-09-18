type TFieldWithOptions = { options?: unknown };

const getOptionsObject = (
  field: TFieldWithOptions,
): Record<string, unknown> | undefined =>
  field.options && typeof field.options === 'object'
    ? (field.options as Record<string, unknown>)
    : undefined;

export const getFieldOptionValues = (field: TFieldWithOptions): string[] => {
  const list = getOptionsObject(field)?.list;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};

export const getFieldOptionsLayout = (
  field: TFieldWithOptions,
): string | undefined => {
  const layout = getOptionsObject(field)?.layout;

  return typeof layout === 'string' ? layout : undefined;
};
