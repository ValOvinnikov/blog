import {
  LOCALE_ISO_CODES,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { createMissingTranslationPane } from '@blog/studio/structure/missing-translation-pane/missing-translation-pane';
import type { ComponentType } from 'react';
import { getPublishedId, type SchemaTypeDefinition } from 'sanity';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

type TDividerBuilder = ReturnType<StructureBuilder['divider']>;

type TStructureSchema = Pick<SchemaTypeDefinition, 'name' | 'title' | 'icon'>;

type TStructureGroupItem = {
  schema: TStructureSchema;
  mode?: 'list' | 'singleton' | 'byLanguage' | 'onePerLanguage';
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

const ALL_PAGES_TITLE = 'All pages';

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
        S.documentTypeList(name)
          .id(id)
          .title(`${listTitle} ${title}`)
          .filter(filter)
          .params({ type: name, ...params })
          .initialValueTemplates(
            templateIds.map((templateId) =>
              S.initialValueTemplateItem(templateId),
            ),
          ),
      );

  const templateIdFor = (locale: TLocaleIsoCode) => `${name}-${locale}`;

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
              templateIdFor(locale),
              LOCALE_NATIVE_LABEL[locale],
              `_type == $type && ${LANGUAGE_FIELD} == $language`,
              { language: locale },
              [templateIdFor(locale)],
            ),
          ),
          S.divider(),
          languageList(
            `${name}-all`,
            ALL_PAGES_TITLE,
            '_type == $type',
            {},
            locales.map(templateIdFor),
          ),
        ]),
    );
};

const ONE_PER_LANGUAGE_API_VERSION = '2024-01-01';
const ONE_PER_LANGUAGE_QUERY = `{
  "current": *[_type == $type && coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $language] | order(_updatedAt desc)[0]._id,
  "fallback": *[_type == $type && coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $defaultLanguage] | order(_updatedAt desc)[0]._id
}`;

type TOnePerLanguageIds = { current: string | null; fallback: string | null };

const buildOnePerLanguageItems = (
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
): ListItemBuilder[] => {
  const [defaultLocale = LOCALE_ISO_CODES.EN] = locales;

  const resolveDocument = async (locale: TLocaleIsoCode) => {
    const templateId = `${name}-${locale}`;
    const { current, fallback } = await S.context
      .getClient({ apiVersion: ONE_PER_LANGUAGE_API_VERSION })
      .fetch<TOnePerLanguageIds>(ONE_PER_LANGUAGE_QUERY, {
        type: name,
        language: locale,
        defaultLanguage: defaultLocale,
      });

    if (current) {
      return S.document().schemaType(name).documentId(getPublishedId(current));
    }

    if (locale === defaultLocale) {
      return S.document()
        .schemaType(name)
        .documentId(name)
        .initialValueTemplate(templateId);
    }

    return S.component(
      createMissingTranslationPane({
        schemaType: name,
        title,
        locale,
        defaultLocale,
        defaultDocumentId: fallback ? getPublishedId(fallback) : undefined,
      }),
    )
      .id(templateId)
      .title(`${LOCALE_NATIVE_LABEL[locale]} ${title}`);
  };

  return locales.map((locale) =>
    S.listItem()
      .title(LOCALE_NATIVE_LABEL[locale])
      .id(`${name}-${locale}`)
      .icon(icon)
      .child(() => resolveDocument(locale)),
  );
};

const buildGroupItems = (
  S: StructureBuilder,
  item: TStructureGroupItem,
  locales: readonly TLocaleIsoCode[],
): ListItemBuilder[] => {
  const { name } = item.schema;
  const title = requireSchemaField(item.schema.title, name, 'title');
  const icon = requireSchemaField(item.schema.icon, name, 'icon');

  if (item.mode === 'onePerLanguage') {
    return buildOnePerLanguageItems(S, { name, title, icon }, locales);
  }

  return [buildGroupItem(S, { name, title, icon, mode: item.mode }, locales)];
};

const buildGroupItem = (
  S: StructureBuilder,
  {
    name,
    title,
    icon,
    mode,
  }: {
    name: string;
    title: string;
    icon: TStructureSchema['icon'];
    mode: TStructureGroupItem['mode'];
  },
  locales: readonly TLocaleIsoCode[],
): ListItemBuilder => {
  if (mode === 'byLanguage') {
    return buildByLanguageItem(S, { name, title, icon }, locales);
  }

  if (mode === 'singleton') {
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
      ...group.items.flatMap((item) => buildGroupItems(S, item, locales)),
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
