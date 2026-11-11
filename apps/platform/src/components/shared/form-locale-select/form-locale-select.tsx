'use client';

import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import type { TFieldAppearance } from '@platform/constants/field-appearance';
import { useTranslations } from 'next-intl';

export type TFormLocaleSelectProps = {
  label: string;
  hint: string;
  error?: string;
  value: TLocaleIsoCode;
  onChange: (locale: TLocaleIsoCode) => void;
  appearance?: TFieldAppearance;
};

export const FormLocaleSelect = ({
  label,
  hint,
  error,
  value,
  onChange,
  appearance,
}: TFormLocaleSelectProps) => {
  const tLanguage = useTranslations('languageNames');

  return (
    <FormField label={label} hint={hint} error={error} control={{ appearance }}>
      <OptionSelect
        options={toOptions(LOCALE_ISO_CODES, (locale) => tLanguage(locale))}
        value={value}
        onChange={onChange}
        appearance={appearance}
      />
    </FormField>
  );
};
