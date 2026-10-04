import type { SchemaType } from 'sanity';

export const isLocalizedSchemaType = (
  schemaType: SchemaType | null | undefined,
): boolean =>
  schemaType !== undefined &&
  schemaType !== null &&
  (schemaType.name.startsWith('internationalizedArray') ||
    isLocalizedSchemaType(schemaType.type));
