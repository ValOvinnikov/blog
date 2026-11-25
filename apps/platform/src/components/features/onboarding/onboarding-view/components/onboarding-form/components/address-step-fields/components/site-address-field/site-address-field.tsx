'use client';

import {
  AddressVerdict,
  type TAddressVerdict,
} from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-verdict';
import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import { FormSiteAddressInput } from '@platform/components/shared/form-site-address-input';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import type { TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export type TSiteAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
  verdict: TAddressVerdict;
};

export const SiteAddressField = ({
  value,
  onChange,
  rootDomain,
  verdict,
}: TSiteAddressFieldProps) => {
  const t = useTranslations('onboardingForm');
  const errorText = useFieldErrorText();
  const { error } = verdict;

  return (
    <FormSiteAddressInput
      copy={{
        label: t('siteAddressLabel'),
        hint: t('siteAddressHint'),
        error: error && errorText(error),
      }}
      value={value}
      onChange={onChange}
      rootDomain={rootDomain}
      appearance={FIELD_APPEARANCE.WIZARD}
      status={<AddressVerdict verdict={verdict} />}
    />
  );
};
