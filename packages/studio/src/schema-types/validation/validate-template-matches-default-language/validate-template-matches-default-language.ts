import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { fetchDefaultLanguagePageField } from '@blog/studio/schema-types/validation/default-language-page-field/default-language-page-field';
import type { Reference, ValidationContext } from 'sanity';

export const validateTemplateMatchesDefaultLanguage = async (
  value: Reference | undefined,
  context: ValidationContext,
): Promise<true | string> => {
  if (!value?._ref) return true;

  const defaultPage = await fetchDefaultLanguagePageField<string>(
    context,
    'template._ref',
  );

  return !defaultPage?.value || defaultPage.value === value._ref
    ? true
    : `This page uses a different template from its ${LOCALE_LABEL[defaultPage.language]} page.`;
};
