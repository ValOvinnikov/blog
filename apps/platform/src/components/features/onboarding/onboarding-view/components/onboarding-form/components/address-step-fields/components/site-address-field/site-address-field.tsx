'use client';

import type { TMaybeUndefined } from '@blog/config';
import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import { FormSiteAddressInput } from '@platform/components/shared/form-site-address-input';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

export type TSiteAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
  error: TMaybeUndefined<TCreateSiteFieldError>;
};

export const SiteAddressField = ({
  value,
  onChange,
  rootDomain,
  error,
}: TSiteAddressFieldProps) => {
  const t = useTranslations('onboardingForm');
  const errorText = useFieldErrorText();

  return (
    <FormSiteAddressInput
      label={t('siteAddressLabel')}
      hint={t('siteAddressHint')}
      error={error && errorText(error)}
      value={value}
      onChange={onChange}
      rootDomain={rootDomain}
      appearance={FIELD_APPEARANCE.WIZARD}
    />
  );
};
