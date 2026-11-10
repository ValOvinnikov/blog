import {
  LOCALE_ISO_CODES,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { isSingleLanguage } from '@blog/studio/structure/locales/is-single-language';
import { templateIdFor } from '@blog/studio/structure/locales/template-id-for';
import type { TPageItem } from '@blog/studio/structure/page-item/page-item';
import { getPublishedId } from 'sanity';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

const ONE_PER_LANGUAGE_API_VERSION = '2024-01-01';
const ONE_PER_LANGUAGE_QUERY = `*[_type == $type && coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $language] | order(_updatedAt desc)[0]._id`;

export const buildOnePerLanguageItem = (
  S: StructureBuilder,
  { name, title, icon }: TPageItem,
  locales: readonly TLocaleIsoCode[],
): ListItemBuilder => {
  const [defaultLocale = LOCALE_ISO_CODES.EN] = locales;

  const resolveDocument = async (locale: TLocaleIsoCode) => {
    const current = await S.context
      .getClient({ apiVersion: ONE_PER_LANGUAGE_API_VERSION })
      .fetch<TMaybeNull<string>>(ONE_PER_LANGUAGE_QUERY, {
        type: name,
        language: locale,
        defaultLanguage: defaultLocale,
      });

    if (current) {
      return S.document().schemaType(name).documentId(getPublishedId(current));
    }

    return S.document()
      .schemaType(name)
      .documentId(locale === defaultLocale ? name : crypto.randomUUID())
      .initialValueTemplate(templateIdFor(name, locale));
  };

  const item = S.listItem().title(title).id(name).icon(icon);

  if (isSingleLanguage(locales)) {
    return item.child(() => resolveDocument(defaultLocale));
  }

  return item.child(
    S.list()
      .title(title)
      .items(
        locales.map((locale) =>
          S.listItem()
            .title(LOCALE_NATIVE_LABEL[locale])
            .id(templateIdFor(name, locale))
            .icon(icon)
            .child(() => resolveDocument(locale)),
        ),
      ),
  );
};
