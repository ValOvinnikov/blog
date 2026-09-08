import type { SchemaTypeDefinition } from 'sanity';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

type TDividerBuilder = ReturnType<StructureBuilder['divider']>;

type TStructureSchema = Pick<SchemaTypeDefinition, 'name' | 'title' | 'icon'>;

export type TStructureGroupItem = {
  schema: TStructureSchema;
  mode?: 'list' | 'singleton';
};

export type TStructureGroup = {
  title?: string;
  items: TStructureGroupItem[];
};

const requireSchemaField = <TValue>(
  value: TValue | undefined,
  schemaName: string,
  field: string,
): TValue => {
  if (value === undefined) {
    throw new Error(
      `Studio desk schema "${schemaName}" has no "${field}" — every desk entry needs one.`,
    );
  }
  return value;
};

const buildGroupItem = (
  S: StructureBuilder,
  item: TStructureGroupItem,
): ListItemBuilder => {
  const { name } = item.schema;
  const title = requireSchemaField(item.schema.title, name, 'title');
  const icon = requireSchemaField(item.schema.icon, name, 'icon');

  if (item.mode === 'singleton') {
    return S.listItem()
      .title(title)
      .id(name)
      .icon(icon)
      .child(S.document().schemaType(name).documentId(name));
  }

  return S.documentTypeListItem(name).title(title).icon(icon);
};

/** Flattens groups into a flat item list, prefixing a titled group with a divider and leaving an untitled group bare. */
export const buildGroupedListItems = (
  S: StructureBuilder,
  groups: TStructureGroup[],
): (ListItemBuilder | TDividerBuilder)[] =>
  groups
    .filter((group) => group.items.length > 0)
    .flatMap((group) => [
      ...(group.title ? [S.divider().title(group.title)] : []),
      ...group.items.map((item) => buildGroupItem(S, item)),
    ]);
