'use client';

import type { TMaybeUndefined } from '@blog/config';
import { TENANT_FIELD_LOCK_KIND } from '@platform/constants/tenant';
import type { TTenantFieldLockReason } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useTranslations } from 'next-intl';

export const useLockReasonText = () => {
  const t = useTranslations('tenantDetailsPanel');
  const tSteps = useTranslations('provisioningStatusView');

  return (
    reason: TMaybeUndefined<TTenantFieldLockReason>,
  ): TMaybeUndefined<string> => {
    if (!reason) {
      return undefined;
    }
    switch (reason.kind) {
      case TENANT_FIELD_LOCK_KIND.STEP:
        return t('fieldLockedReasonStep', {
          step: tSteps(`stepLabel.${reason.step}`),
        });
      case TENANT_FIELD_LOCK_KIND.SUCCEEDED:
        return t('fieldLockedReasonSucceeded');
      case TENANT_FIELD_LOCK_KIND.ARCHIVED:
        return t('fieldLockedReasonArchived');
      case TENANT_FIELD_LOCK_KIND.RUNNING:
        return t('fieldLockedReasonRunning');
      default: {
        const unhandledReason: never = reason;
        throw new Error(
          `lockReasonText: unhandled reason ${JSON.stringify(unhandledReason)}`,
        );
      }
    }
  };
};
