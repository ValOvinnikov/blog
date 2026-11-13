import { ALERT_TYPE } from '@blog/config';
import type { TPlanChangeProgress } from '@platform/components/features/upgrade/plan-change/use-plan-change';
import { WebhookWaitStatus } from '@platform/components/features/upgrade/webhook-wait-status';
import { Alert } from '@platform/components/shared/alert';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TPlanChangeStatusProps = {
  progress: TPlanChangeProgress;
  fallback: ReactNode;
};

export const PlanChangeStatus = ({
  progress: { refusal, hasFailed, isConfirming, isSlow, checkAgain },
  fallback,
}: TPlanChangeStatusProps) => {
  const t = useTranslations('upgradePage');

  if (isConfirming) {
    return (
      <WebhookWaitStatus
        isSlow={isSlow}
        confirming={{
          title: t('changeConfirmingTitle'),
          description: t('changeConfirmingDescription'),
        }}
        slow={{
          title: t('slowTitle'),
          description: t('changeSlowDescription'),
        }}
        onCheckAgain={checkAgain}
      />
    );
  }
  if (refusal) {
    return <Alert type={ALERT_TYPE.INFO} description={t(refusal)} />;
  }
  if (hasFailed) {
    return <Alert type={ALERT_TYPE.ERROR} description={t('changeFailed')} />;
  }
  return fallback;
};
