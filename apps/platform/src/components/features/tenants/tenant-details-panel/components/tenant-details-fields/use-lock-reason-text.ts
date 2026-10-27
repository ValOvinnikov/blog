'use client';

import type { TMaybeUndefined } from '@blog/config';
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
      case 'step':
        return t('fieldLockedReasonStep', {
          step: tSteps(`stepLabel.${reason.step}`),
        });
      case 'succeeded':
        return t('fieldLockedReasonSucceeded');
      case 'archived':
        return t('fieldLockedReasonArchived');
      case 'running':
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
