'use client';

import type { TLocaleIsoCode } from '@blog/config/constants';
import { SegmentedRadioGroup } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

export type TLanguagePickerProps = {
  locales: TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
  value: TLocaleIsoCode;
  onChange: (locale: TLocaleIsoCode) => void;
  countCustomised: (locale: TLocaleIsoCode) => number;
};

export const LanguagePicker = ({
  locales,
  defaultLocale,
  value,
  onChange,
  countCustomised,
}: TLanguagePickerProps) => {
  const t = useTranslations('languagePicker');
  const tLanguage = useTranslations('languageNames');

  return (
    <SegmentedRadioGroup
      aria={{ label: t('ariaLabel') }}
      options={locales.map((locale) => {
        const isDefault = locale === defaultLocale;

        return {
          value: locale,
          label: tLanguage(locale),
          description: t('optionDescription', {
            isDefault: String(isDefault),
            count: countCustomised(locale),
          }),
          isWide: isDefault,
        };
      })}
      value={value}
      onChange={onChange}
    />
  );
};
