'use client';

import { LOCALE_ISO_CODES, type TMaybeUndefined } from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
import { SiteAddressField } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-step-fields/components/site-address-field';
import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import type {
  TCreateSiteFieldError,
  TCreateSiteInput,
} from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

export type TAddressStepFieldsProps = {
  values: TCreateSiteInput;
  rootDomain: TMaybeUndefined<string>;
  addressError: TMaybeUndefined<TCreateSiteFieldError>;
  onFieldChange: (patch: Partial<TCreateSiteInput>) => void;
};

export const AddressStepFields = ({
  values,
  rootDomain,
  addressError,
  onFieldChange,
}: TAddressStepFieldsProps) => {
  const t = useTranslations('onboardingForm');
  const tLanguage = useTranslations('languageNames');

  return (
    <>
      <SiteAddressField
        value={values.slug}
        onChange={(slug) => onFieldChange({ slug })}
        rootDomain={rootDomain}
        error={addressError}
      />
      <FormField
        label={t('languageLabel')}
        hint={t('languageHint')}
        control={{ appearance: FIELD_APPEARANCE.WIZARD }}
      >
        <OptionSelect
          options={toOptions(LOCALE_ISO_CODES, (locale) => tLanguage(locale))}
          value={values.locale}
          onChange={(locale) => onFieldChange({ locale })}
          appearance={FIELD_APPEARANCE.WIZARD}
        />
      </FormField>
    </>
  );
};
