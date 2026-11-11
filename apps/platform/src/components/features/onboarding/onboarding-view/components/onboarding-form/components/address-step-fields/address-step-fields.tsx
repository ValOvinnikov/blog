'use client';

import type { TMaybeUndefined } from '@blog/config';
import { SiteAddressField } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-step-fields/components/site-address-field';
import { FormLocaleSelect } from '@platform/components/shared/form-locale-select';
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

  return (
    <>
      <SiteAddressField
        value={values.slug}
        onChange={(slug) => onFieldChange({ slug })}
        rootDomain={rootDomain}
        error={addressError}
      />
      <FormLocaleSelect
        label={t('languageLabel')}
        hint={t('languageHint')}
        value={values.locale}
        onChange={(locale) => onFieldChange({ locale })}
        appearance={FIELD_APPEARANCE.WIZARD}
      />
    </>
  );
};
