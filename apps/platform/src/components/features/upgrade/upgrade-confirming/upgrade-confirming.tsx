'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Spinner } from '@platform/components/shared/spinner';
import {
  type TUpgradeState,
  UPGRADE_POLL,
  UPGRADE_STATE,
} from '@platform/constants/billing';
import { useRouter } from '@platform/i18n/navigation';
import { getUpgradeStateAction } from '@platform/server/billing/get-upgrade-state-action';
import { usePolledValue } from '@platform/utils/use-polled-value/use-polled-value';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type TUpgradeConfirmingProps = {
  tenantId: string;
  initialState: TUpgradeState;
};

const isAwaitingSubscription = (state: TUpgradeState) =>
  state !== UPGRADE_STATE.SUBSCRIBED;

export const UpgradeConfirming = ({
  tenantId,
  initialState,
}: TUpgradeConfirmingProps) => {
  const t = useTranslations('upgradePage');
  const router = useRouter();
  const [hasFailed, setHasFailed] = useState(false);
  const {
    value: state,
    restart,
    isExhausted,
  } = usePolledValue(tenantId, initialState, getUpgradeStateAction, {
    intervalMs: UPGRADE_POLL.INTERVAL_MS,
    maxTicks: UPGRADE_POLL.MAX_TICKS,
    isActive: isAwaitingSubscription,
    onResult: (next) => {
      if (!isAwaitingSubscription(next)) router.refresh();
    },
    onError: () => setHasFailed(true),
  });

  const checkAgain = () => {
    setHasFailed(false);
    restart();
    router.refresh();
  };

  if (!isAwaitingSubscription(state)) {
    return (
      <Alert
        type={ALERT_TYPE.SUCCESS}
        title={t('confirmedTitle')}
        description={t('confirmedDescription')}
      />
    );
  }

  if (hasFailed || isExhausted) {
    return (
      <Alert
        type={ALERT_TYPE.WARNING}
        title={t('slowTitle')}
        description={t('slowDescription')}
        action={
          <Button size={SIZE.SM} onClick={checkAgain}>
            {t('checkAgain')}
          </Button>
        }
      />
    );
  }

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      title={t('confirmingTitle')}
      description={t('confirmingDescription')}
      action={
        <span aria-hidden="true">
          <Spinner label={t('confirmingTitle')} />
        </span>
      }
    />
  );
};
