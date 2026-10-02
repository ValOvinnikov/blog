import type { TLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_SWITCHER_FIELD_NAME } from '@blog/studio/schema-types/fields/language-switcher-field/language-switcher-field';
import type { FieldProps } from 'sanity';

export const createLanguageSwitcherField = (
  liveLocales: readonly TLocaleIsoCode[],
) => {
  const hasSingleLanguage = liveLocales.length < 2;

  return function LanguageSwitcherField(props: FieldProps) {
    if (hasSingleLanguage && props.name === LANGUAGE_SWITCHER_FIELD_NAME) {
      return null;
    }

    return props.renderDefault(props);
  };
};
