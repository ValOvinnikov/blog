import {
  LOCALE_ISO_CODES,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { isSingleLanguage } from '@blog/studio/structure/locales/is-single-language';
import { templateIdFor } from '@blog/studio/structure/locales/template-id-for';
import type { TPageItem } from '@blog/studio/structure/page-item/page-item';
import type {
  ChildResolver,
  ListItemBuilder,
  StructureBuilder,
} from 'sanity/structure';

const ALL_PAGES_TITLE = 'All pages';

const topLevelOnly = (filter: string) => `${filter} && !defined(parent)`;

const DEFAULT_LANGUAGE_FILTER = `_type == $type && coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $defaultLanguage`;

type TPageTreeFactory = (onlyLanguage?: TLocaleIsoCode) => ChildResolver;

export const buildByLanguageItem = (
  S: StructureBuilder,
  { name, title, icon }: TPageItem,
  locales: readonly TLocaleIsoCode[],
  createPageTree?: TPageTreeFactory,
): ListItemBuilder => {
  const languageList = (
    id: string,
    listTitle: string,
    filter: string,
    params: Record<string, string>,
    templateIds: string[],
    resolveChild?: ChildResolver,
  ) => {
    const list = S.documentTypeList(name)
      .id(id)
      .title(`${listTitle} ${title}`)
      .filter(resolveChild ? topLevelOnly(filter) : filter)
      .params({ type: name, ...params })
      .initialValueTemplates(
        templateIds.map((templateId) => S.initialValueTemplateItem(templateId)),
      );

    return S.listItem()
      .title(listTitle)
      .id(id)
      .icon(icon)
      .child(resolveChild ? list.child(resolveChild) : list);
  };

  if (isSingleLanguage(locales)) {
    const [defaultLocale = LOCALE_ISO_CODES.EN] = locales;
    const list = S.documentTypeList(name)
      .id(name)
      .title(title)
      .filter(
        createPageTree
          ? topLevelOnly(DEFAULT_LANGUAGE_FILTER)
          : DEFAULT_LANGUAGE_FILTER,
      )
      .params({ type: name, defaultLanguage: defaultLocale })
      .initialValueTemplates([
        S.initialValueTemplateItem(templateIdFor(name, defaultLocale)),
      ]);

    return S.listItem()
      .title(title)
      .id(name)
      .icon(icon)
      .child(createPageTree ? list.child(createPageTree(defaultLocale)) : list);
  }

  const pageTree = createPageTree?.();

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
              templateIdFor(name, locale),
              LOCALE_NATIVE_LABEL[locale],
              `_type == $type && ${LANGUAGE_FIELD} == $language`,
              { language: locale },
              [templateIdFor(name, locale)],
              pageTree,
            ),
          ),
          S.divider(),
          languageList(
            `${name}-all`,
            ALL_PAGES_TITLE,
            '_type == $type',
            {},
            locales.map((locale) => templateIdFor(name, locale)),
          ),
        ]),
    );
};
