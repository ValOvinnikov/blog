import type { ComponentType } from 'react';
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
  dividerBefore?: boolean;
  items: TStructureGroupItem[];
};

export type TStructureSection = {
  title: string;
  id: string;
  icon: ComponentType;
  groups: TStructureGroup[];
  dividerBefore?: boolean;
  flattenSingleItem?: boolean;
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

export const buildGroupedListItems = (
  S: StructureBuilder,
  groups: TStructureGroup[],
): (ListItemBuilder | TDividerBuilder)[] =>
  groups
    .filter((group) => group.items.length > 0)
    .flatMap((group) => [
      ...(group.title
        ? [S.divider().title(group.title)]
        : group.dividerBefore
          ? [S.divider()]
          : []),
      ...group.items.map((item) => buildGroupItem(S, item)),
    ]);

const getFlattenableItem = (
  section: TStructureSection,
): TStructureGroupItem | undefined => {
  const items = section.groups.flatMap((group) => group.items);
  const [item] = items;
  return items.length === 1 && item?.mode !== 'singleton' ? item : undefined;
};

export const buildSection = (
  S: StructureBuilder,
  section: TStructureSection,
): ListItemBuilder => {
  if (section.flattenSingleItem) {
    const item = getFlattenableItem(section);
    if (!item) {
      throw new Error(
        `Studio desk section "${section.id}" sets flattenSingleItem but has no single non-singleton item to flatten.`,
      );
    }
    const { name } = item.schema;

    return S.listItem()
      .title(section.title)
      .id(section.id)
      .icon(section.icon)
      .child(S.documentTypeList(name).title(section.title));
  }

  return S.listItem()
    .title(section.title)
    .id(section.id)
    .icon(section.icon)
    .child(
      S.list()
        .title(section.title)
        .items(buildGroupedListItems(S, section.groups)),
    );
};

export const buildSections = (
  S: StructureBuilder,
  sections: TStructureSection[],
): (ListItemBuilder | TDividerBuilder)[] =>
  sections.flatMap((section) => [
    ...(section.dividerBefore ? [S.divider()] : []),
    buildSection(S, section),
  ]);
