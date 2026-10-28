'use client';

import type { TMaybeUndefined } from '@blog/config';
import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import type { TSiteAddressCheck } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-site-address-check';
import { FormSiteAddressInput } from '@platform/components/shared/form-site-address-input';
import { Spinner } from '@platform/components/shared/spinner';
import { Text } from '@platform/components/shared/text';
import { SITE_ADDRESS_STATUS } from '@platform/constants/onboarding';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

export type TSiteAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
  check: TSiteAddressCheck;
  submittedError: TMaybeUndefined<TCreateSiteFieldError>;
};

export const SiteAddressField = ({
  value,
  onChange,
  rootDomain,
  check: { status, error: checkError },
  submittedError,
}: TSiteAddressFieldProps) => {
  const t = useTranslations('onboardingForm');
  const toErrorText = useFieldErrorText();
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
