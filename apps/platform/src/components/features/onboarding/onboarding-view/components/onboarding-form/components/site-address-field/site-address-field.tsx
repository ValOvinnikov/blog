'use client';

import type { TMaybeUndefined } from '@blog/config';
import { FormSiteAddressInput } from '@platform/components/shared/form-site-address-input';
import { Spinner } from '@platform/components/shared/spinner';
import { Text } from '@platform/components/shared/text';
import { SITE_ADDRESS_STATUS } from '@platform/constants/onboarding';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

import { useSiteAddressCheck } from './use-site-address-check';

export type TSiteAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
  submittedError: TMaybeUndefined<TCreateSiteFieldError>;
  toErrorText: (error: TCreateSiteFieldError) => string;
};

export const SiteAddressField = ({
  value,
  onChange,
  rootDomain,
  submittedError,
  toErrorText,
}: TSiteAddressFieldProps) => {
  const t = useTranslations('onboardingForm');
  const { status, error: checkError } = useSiteAddressCheck(value);
  const error = submittedError ?? checkError;

  const isAvailable =
    status === SITE_ADDRESS_STATUS.AVAILABLE && !submittedError;

  return (
    <FormSiteAddressInput
      label={t('siteAddressLabel')}
      hint={t('siteAddressHint')}
      error={error && toErrorText(error)}
      footer={
        <>
          {status === SITE_ADDRESS_STATUS.CHECKING && (
            <Spinner label={t('siteAddressChecking')} hasLabel={true} />
          )}
          {isAvailable && (
            <Text variant="meta">
              {t('siteAddressAvailable', { address: `${value}.${rootDomain}` })}
            </Text>
          )}
        </>
      }
      value={value}
      onChange={onChange}
      rootDomain={rootDomain}
    />
  );
};
