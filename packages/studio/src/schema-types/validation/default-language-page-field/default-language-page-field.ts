import type { TMaybeNull } from '@blog/config';
import { isLocaleIsoCode, type TLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import {
  fetchFailSafe,
  getDraftsClient,
} from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { isString } from '@blog/utils/primitives';
import { getPublishedId, type ValidationContext } from 'sanity';

type TDefaultLanguagePageField<T> = {
  language: TLocaleIsoCode;
  value: TMaybeNull<T>;
};

/** Reads one field of the default-language version of a translated page, or `null` when the page is that version or has none linked. */
export const fetchDefaultLanguagePageField = async <T>(
  context: ValidationContext,
  fieldPath: string,
): Promise<TMaybeNull<TDefaultLanguagePageField<T>>> => {
  const { document } = context;

  if (!document) return null;

  const defaultLanguage = getDefaultLanguage();
  const language = document[LANGUAGE_FIELD];

  if (
    !isString(language) ||
    !isLocaleIsoCode(language) ||
    language === defaultLanguage
  ) {
    return null;
  }

  const page = await fetchFailSafe<TMaybeNull<{ value?: TMaybeNull<T> }>>(
    getDraftsClient(context),
    `*[_type == "translation.metadata" && references($id)][0].translations[${LANGUAGE_FIELD} == $defaultLanguage][0].value->{ "value": ${fieldPath} }`,
    { id: getPublishedId(document._id), defaultLanguage },
    null,
  );

  return page ? { language: defaultLanguage, value: page.value ?? null } : null;
};
