import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { LANGUAGE_SWITCHER_FIELD_NAME } from '@shinefold/studio/schema-types/fields/language-switcher-field/language-switcher-field';
import { isSingleLanguage } from '@shinefold/studio/structure/locales/is-single-language';
import type { FieldProps } from 'sanity';

export const createLanguageSwitcherField = (
  liveLocales: readonly TLocaleIsoCode[],
) => {
  const hasSingleLanguage = isSingleLanguage(liveLocales);

  return function LanguageSwitcherField(props: FieldProps) {
    if (hasSingleLanguage && props.name === LANGUAGE_SWITCHER_FIELD_NAME) {
      return null;
    }

    return props.renderDefault(props);
  };
};
