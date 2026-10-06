import { isLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getPublishedId, type Reference, type ValidationContext } from 'sanity';

const DEFAULT_LANGUAGE_TEMPLATE_QUERY = `*[_type == "translation.metadata" && references($id)][0].translations[${LANGUAGE_FIELD} == $defaultLanguage][0].value->template._ref`;

export const validateTemplateMatchesDefaultLanguage = async (
  value: Reference | undefined,
  context: ValidationContext,
): Promise<true | string> => {
  const { document } = context;

  if (!value?._ref || !document) return true;

  const defaultLanguage = getDefaultLanguage();
  const language = document[LANGUAGE_FIELD];

  if (
    typeof language !== 'string' ||
    !isLocaleIsoCode(language) ||
    language === defaultLanguage
  ) {
    return true;
  }

  const defaultTemplate = await fetchDraftsFailSafe<string | null>(
    context,
    DEFAULT_LANGUAGE_TEMPLATE_QUERY,
    { id: getPublishedId(document._id), defaultLanguage },
    null,
  );

  return !defaultTemplate || defaultTemplate === value._ref
    ? true
    : `This page uses a different template from its ${LOCALE_LABEL[defaultLanguage]} page.`;
};
