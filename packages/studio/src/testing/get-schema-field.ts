type TSchemaWithFields<TField> = {
  name?: string;
  fields?: readonly TField[];
};

export const getSchemaField = <TField extends { name?: string }>(
  schema: TSchemaWithFields<TField>,
  fieldName: string,
): TField & { name: string } => {
  const field = schema.fields?.find(
    (field): field is TField & { name: string } =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === fieldName,
  );

  if (!field) {
    throw new Error(
      `Expected ${schema.name ?? 'schema'} to define a "${fieldName}" field.`,
    );
  }

  return field;
};
