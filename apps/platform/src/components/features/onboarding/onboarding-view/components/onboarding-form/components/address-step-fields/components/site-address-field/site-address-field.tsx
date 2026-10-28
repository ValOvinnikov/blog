'use client';

import type { TMaybeUndefined } from '@blog/config';
import { FormSiteAddressInput } from '@platform/components/shared/form-site-address-input';
import { useTranslations } from 'next-intl';

export type TSiteAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
  errorId: TMaybeUndefined<string>;
};

export const SiteAddressField = ({
  value,
  onChange,
  rootDomain,
  errorId,
}: TSiteAddressFieldProps) => {
  const t = useTranslations('onboardingForm');

  return (
    <FormSiteAddressInput
      label={t('siteAddressLabel')}
      hint={t('siteAddressHint')}
      errorId={errorId}
      value={value}
      onChange={onChange}
      rootDomain={rootDomain}
    />
  );
};
