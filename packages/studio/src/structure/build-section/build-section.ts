import {
  LOCALE_ISO_CODES,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import type { ComponentType } from 'react';
import type { SchemaTypeDefinition } from 'sanity';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

type TDividerBuilder = ReturnType<StructureBuilder['divider']>;

type TStructureSchema = Pick<SchemaTypeDefinition, 'name' | 'title' | 'icon'>;

type TStructureGroupItem = {
  schema: TStructureSchema;
  mode?: 'list' | 'singleton' | 'byLanguage';
};

type TStructureGroup = {
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

const NO_LANGUAGE_TITLE = 'No language';

const buildByLanguageItem = (
  S: StructureBuilder,
  {
    name,
    title,
    icon,
  }: {
    name: string;
    title: string;
    icon: TStructureSchema['icon'];
  },
  locales: readonly TLocaleIsoCode[],
): ListItemBuilder => {
  const languageList = (
    id: string,
    listTitle: string,
    filter: string,
    params: Record<string, string>,
    templateIds: string[],
  ) =>
    S.listItem()
      .title(listTitle)
      .id(id)
      .icon(icon)
      .child(
        S.documentList()
          .id(id)
          .title(`${listTitle} ${title}`)
          .schemaType(name)
          .filter(filter)
          .params({ type: name, ...params })
          .initialValueTemplates(
            templateIds.map((templateId) =>
              S.initialValueTemplateItem(templateId),
            ),
          ),
      );

  return S.listItem()
    .title(title)
    .id(name)
    .icon(icon)
    .child(
      S.list()
        .title(title)
        .items([
          ...locales.map((locale) =>
            languageList(
              `${name}-${locale}`,
              LOCALE_NATIVE_LABEL[locale],
              `_type == $type && ${LANGUAGE_FIELD} == $language`,
              { language: locale },
              [`${name}-${locale}`],
            ),
          ),
          languageList(
            `${name}-no-language`,
            NO_LANGUAGE_TITLE,
            `_type == $type && !defined(${LANGUAGE_FIELD})`,
            {},
            [],
          ),
        ]),
    );
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

  if (item.mode === 'singleton') {
    return S.listItem()
      .title(title)
      .id(name)
      .icon(icon)
      .child(S.document().schemaType(name).documentId(name));
  }

  return S.documentTypeListItem(name).title(title).icon(icon);
};

const buildGroupedListItems = (
  S: StructureBuilder,
  groups: TStructureGroup[],
  locales: readonly TLocaleIsoCode[],
): (ListItemBuilder | TDividerBuilder)[] =>
  groups
    .filter((group) => group.items.length > 0)
    .flatMap((group) => [
      ...(group.title
        ? [S.divider().title(group.title)]
        : group.dividerBefore
          ? [S.divider()]
          : []),
      ...group.items.map((item) => buildGroupItem(S, item, locales)),
    ]);

const getFlattenableItem = (
  section: TStructureSection,
): TStructureGroupItem | undefined => {
  const items = section.groups.flatMap((group) => group.items);
  const [item] = items;
  return items.length === 1 && item?.mode !== 'singleton' ? item : undefined;
};

const buildSection = (
  S: StructureBuilder,
  section: TStructureSection,
  locales: readonly TLocaleIsoCode[],
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
        .items(buildGroupedListItems(S, section.groups, locales)),
    );
};

export const buildSections = (
  S: StructureBuilder,
  sections: TStructureSection[],
  locales: readonly TLocaleIsoCode[] = Object.values(LOCALE_ISO_CODES),
): (ListItemBuilder | TDividerBuilder)[] =>
  sections.flatMap((section) => [
    ...(section.dividerBefore ? [S.divider()] : []),
    buildSection(S, section, locales),
  ]);
