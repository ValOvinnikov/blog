import { ALERT_TYPE, SIZE } from '@blog/config';
import type { TPlanChangeProgress } from '@platform/components/features/upgrade/plan-change/use-plan-change';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Spinner } from '@platform/components/shared/spinner';
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

  if (isSlow || (isConfirming && hasFailed)) {
    return (
      <Alert
        type={ALERT_TYPE.WARNING}
        title={t('slowTitle')}
        description={t('changeSlowDescription')}
        action={
          <Button size={SIZE.SM} onClick={checkAgain}>
            {t('checkAgain')}
          </Button>
        }
      />
    );
  }
  if (isConfirming) {
    return (
      <Alert
        type={ALERT_TYPE.INFO}
        title={t('changeConfirmingTitle')}
        description={t('changeConfirmingDescription')}
        action={
          <span aria-hidden="true">
            <Spinner label={t('changeConfirmingTitle')} />
          </span>
        }
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
