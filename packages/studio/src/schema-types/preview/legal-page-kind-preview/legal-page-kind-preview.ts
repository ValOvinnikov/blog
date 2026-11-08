import type { TLegalPageKind, TLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { LEGAL_PAGE_KIND_FIELD } from '@blog/studio/schema-types/validation/validate-unique-legal-page-kind/validate-unique-legal-page-kind';
import { toTitleCase } from '@blog/utils/primitives';

export const legalPageKindPreview = {
  select: {
    title: 'title',
    kind: LEGAL_PAGE_KIND_FIELD,
    language: LANGUAGE_FIELD,
  },
  prepare: ({
    title,
    kind,
    language,
  }: {
    title?: string;
    kind?: TLegalPageKind;
    language?: TLocaleIsoCode;
  }) => ({
    title: title ?? 'Unknown',
    subtitle:
      [kind && toTitleCase(kind), language && LOCALE_LABEL[language]]
        .filter(Boolean)
        .join(' · ') || undefined,
  }),
};
