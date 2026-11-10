import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { buildByLanguageItem } from '@blog/studio/structure/build-by-language-item/build-by-language-item';
import { buildOnePerLanguageItem } from '@blog/studio/structure/build-one-per-language-item/build-one-per-language-item';
import { createPageTreeResolver } from '@blog/studio/structure/page-tree/page-tree';
import { hasLength, isUndefined } from '@blog/utils/primitives';
import type { SchemaTypeDefinition } from 'sanity';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

export type TDividerBuilder = ReturnType<StructureBuilder['divider']>;

type TStructureSchema = Pick<SchemaTypeDefinition, 'name' | 'title' | 'icon'>;

export type TStructureGroupItem = {
  schema: TStructureSchema;
  mode?: 'list' | 'singleton' | 'byLanguage' | 'onePerLanguage' | 'pageTree';
};

export type TStructureGroup = {
  title?: string;
  dividerBefore?: boolean;
  items: TStructureGroupItem[];
};

const requireSchemaField = <TValue>(
  value: TMaybeUndefined<TValue>,
  schemaName: string,
  field: string,
): TValue => {
  if (isUndefined(value)) {
    throw new Error(
      `Studio desk schema "${schemaName}" has no "${field}" — every desk entry needs one.`,
    );
  }
  return value;
};

const buildGroupItem = (
  S: StructureBuilder,
  item: TStructureGroupItem,
  locales: readonly TLocaleIsoCode[],
): ListItemBuilder => {
  const { name } = item.schema;
  const title = requireSchemaField(item.schema.title, name, 'title');
  const icon = requireSchemaField(item.schema.icon, name, 'icon');

  if (item.mode === 'byLanguage') {
    return buildByLanguageItem(S, { name, title, icon }, locales);
  }

  if (item.mode === 'pageTree') {
    return buildByLanguageItem(
      S,
      { name, title, icon },
      locales,
      (onlyLanguage) => createPageTreeResolver(S, { name, icon, onlyLanguage }),
    );
  }

  if (item.mode === 'onePerLanguage') {
    return buildOnePerLanguageItem(S, { name, title, icon }, locales);
  }

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
  locales: readonly TLocaleIsoCode[],
): (ListItemBuilder | TDividerBuilder)[] =>
  groups
    .filter((group) => hasLength(group.items))
    .flatMap((group) => [
      ...(group.title
        ? [S.divider().title(group.title)]
        : group.dividerBefore
          ? [S.divider()]
          : []),
      ...group.items.map((item) => buildGroupItem(S, item, locales)),
    ]);
