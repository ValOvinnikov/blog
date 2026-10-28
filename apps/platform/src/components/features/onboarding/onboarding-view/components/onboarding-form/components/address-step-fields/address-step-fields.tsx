'use client';

import { LOCALE_ISO_CODES, type TMaybeUndefined } from '@blog/config';
import { SiteAddressField } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-step-fields/components/site-address-field';
import type { TOnboardingFieldErrors } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-form';
import type { TSiteAddressCheck } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-site-address-check';
import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import type { TCreateSiteInput } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

export type TAddressStepFieldsProps = {
  values: TCreateSiteInput;
  fieldErrors: TOnboardingFieldErrors;
  rootDomain: TMaybeUndefined<string>;
  addressCheck: TSiteAddressCheck;
  onFieldChange: (patch: Partial<TCreateSiteInput>) => void;
};

export const AddressStepFields = ({
  values,
  fieldErrors,
  rootDomain,
  addressCheck,
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
        check={addressCheck}
        submittedError={fieldErrors.slug?.reason}
      />
      <FormField label={t('languageLabel')} hint={t('languageHint')}>
        <OptionSelect
          options={Object.values(LOCALE_ISO_CODES).map((locale) => ({
            value: locale,
            label: tLanguage(locale),
          }))}
          value={values.locale}
          onChange={(locale) => onFieldChange({ locale })}
        />
      </FormField>
    </>
  );
};
