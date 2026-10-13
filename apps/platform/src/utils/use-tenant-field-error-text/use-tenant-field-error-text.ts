'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TTenantFieldError } from '@platform/server/tenants/tenant-field-error';
import { useTranslations } from 'next-intl';

export const useTenantFieldErrorText = () => {
  const t = useTranslations('tenantFieldErrors');
  const tPanel = useTranslations('tenantDetailsPanel');
  const tSteps = useTranslations('provisioningStatusView');

  return (
    error: TMaybeUndefined<TTenantFieldError>,
  ): TMaybeUndefined<string> => {
    if (!error) return undefined;
    if (error.reason === 'domainLocked') {
      return tPanel('fieldLockedReasonStep', {
        step: tSteps(`stepLabel.${error.step}`),
      });
    }
    return t(error.reason);
  };
};
