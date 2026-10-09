'use client';

import type { TLocaleIsoCode } from '@blog/config/constants';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
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
    <SegmentedControl
      options={locales.map((locale) => ({
        value: locale,
        label: tLanguage(locale),
        description: t('optionDescription', {
          isDefault: String(locale === defaultLocale),
          count: countCustomised(locale),
        }),
      }))}
      value={value}
      onChange={onChange}
      ariaLabel={t('ariaLabel')}
    />
  );
};
