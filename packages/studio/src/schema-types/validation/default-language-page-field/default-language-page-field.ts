import { isLocaleIsoCode, type TLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getPublishedId, type ValidationContext } from 'sanity';

type TDefaultLanguagePageField<T> = {
  language: TLocaleIsoCode;
  value: T | null;
};

/** Reads one field of the default-language version of a translated page, or `null` when the page is that version or has none linked. */
export const fetchDefaultLanguagePageField = async <T>(
  context: ValidationContext,
  fieldPath: string,
): Promise<TDefaultLanguagePageField<T> | null> => {
  const { document } = context;

  if (!document) return null;

  const defaultLanguage = getDefaultLanguage();
  const language = document[LANGUAGE_FIELD];

  if (
    typeof language !== 'string' ||
    !isLocaleIsoCode(language) ||
    language === defaultLanguage
  ) {
    return null;
  }

  const page = await fetchDraftsFailSafe<{ value?: T | null } | null>(
    context,
    `*[_type == "translation.metadata" && references($id)][0].translations[${LANGUAGE_FIELD} == $defaultLanguage][0].value->{ "value": ${fieldPath} }`,
    { id: getPublishedId(document._id), defaultLanguage },
    null,
  );

  return page ? { language: defaultLanguage, value: page.value ?? null } : null;
};
