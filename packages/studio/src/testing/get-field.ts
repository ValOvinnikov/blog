type TSchemaWithFields<TField> = {
  name?: string;
  fields?: readonly TField[];
};

/**
 * Looks up a field by name on a schema's `fields` array, throwing a clear
 * error naming the missing field and its schema — the lookup nearly every
 * schema test needs before asserting on a specific field's shape.
 */
export const getField = <TField>(
  schema: TSchemaWithFields<TField>,
  name: string,
): TField & { name: string } => {
  const field = schema.fields?.find(
    (field): field is TField & { name: string } =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      (field as { name?: unknown }).name === name,
  );

  if (!field) {
    throw new Error(
      `Expected ${schema.name ?? 'schema'} to define a "${name}" field.`,
    );
  }

  return field;
};
