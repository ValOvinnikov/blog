import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { fetchDefaultLanguagePageField } from '@blog/studio/schema-types/validation/default-language-page-field/default-language-page-field';
import type { ValidationContext } from 'sanity';

type TSetting = {
  field: string;
  title: string;
  initialValue: boolean;
};

export const validateSettingMatchesDefaultLanguage =
  ({ field, title, initialValue }: TSetting) =>
  async (
    value: boolean | undefined,
    context: ValidationContext,
  ): Promise<true | string> => {
    const defaultPage = await fetchDefaultLanguagePageField<boolean>(
      context,
      field,
    );

    if (!defaultPage) return true;

    return (value ?? initialValue) === (defaultPage.value ?? initialValue)
      ? true
      : `"${title}" is set differently from its ${LOCALE_LABEL[defaultPage.language]} page.`;
  };
