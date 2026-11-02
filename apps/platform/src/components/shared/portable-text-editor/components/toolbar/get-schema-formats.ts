import type { TMaybeUndefined } from '@blog/config';
import type { SchemaDefinition } from '@portabletext/editor';

const hasName = (
  entries: TMaybeUndefined<readonly { name: string }[]>,
  name: string,
): boolean => entries?.some((entry) => entry.name === name) ?? false;

export const getSchemaFormats = (schema: SchemaDefinition) => ({
  hasBold: hasName(schema.decorators, 'strong'),
  hasItalic: hasName(schema.decorators, 'em'),
  hasHeading: hasName(schema.styles, 'h2'),
  hasBulletList: hasName(schema.lists, 'bullet'),
  hasNumberedList: hasName(schema.lists, 'number'),
  hasLink: hasName(schema.annotations, 'link'),
});
