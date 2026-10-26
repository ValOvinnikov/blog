'use client';

import type { TMaybeUndefined } from '@blog/config';
import { FormField } from '@platform/components/shared/form-field';
import { Spinner } from '@platform/components/shared/spinner';
import { Text } from '@platform/components/shared/text';
import { TextInput } from '@platform/components/shared/text-input';
import { SITE_ADDRESS_STATUS } from '@platform/constants/onboarding';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

import { siteAddressFieldVariants } from './site-address-field-variants';
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
  const { row, input, suffix } = siteAddressFieldVariants();
  const error = submittedError ?? checkError;

  const statusLine =
    status === SITE_ADDRESS_STATUS.CHECKING ? (
      <Spinner label={t('siteAddressChecking')} hasLabel={true} />
    ) : status === SITE_ADDRESS_STATUS.AVAILABLE && !submittedError ? (
      <Text variant="meta">
        {t('siteAddressAvailable', { address: `${value}.${rootDomain}` })}
      </Text>
    ) : undefined;

  return (
    <FormField
      label={t('siteAddressLabel')}
      hint={t('siteAddressHint')}
      error={error && toErrorText(error)}
      footer={statusLine}
    >
      <div className={row()}>
        <TextInput
          value={value}
          onChange={(next) => onChange(next.trim().toLowerCase())}
          className={input()}
        />
        {rootDomain && (
          <Text as="span" variant="supporting" className={suffix()}>
            {t('siteAddressSuffix', { rootDomain })}
          </Text>
        )}
      </div>
    </FormField>
  );
};
