import type { TLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';

export const languagePreview = {
  select: {
    title: 'title',
    language: LANGUAGE_FIELD,
  },
  prepare: ({
    title,
    language,
  }: {
    title?: string;
    language?: TLocaleIsoCode;
  }) => ({
    title: title ?? 'Unknown',
    subtitle: language ? LOCALE_LABEL[language] : undefined,
  }),
};
