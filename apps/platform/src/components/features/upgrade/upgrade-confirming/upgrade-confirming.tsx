'use client';

import {
  useWebhookWait,
  WebhookWaitStatus,
} from '@platform/components/features/upgrade/webhook-wait-status';
import { type TUpgradeState, UPGRADE_STATE } from '@platform/constants/billing';
import { getUpgradeStateAction } from '@platform/server/billing/get-upgrade-state-action';
import { useTranslations } from 'next-intl';

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
  const {
    value: state,
    isSlow,
    checkAgain,
  } = useWebhookWait(
    tenantId,
    initialState,
    getUpgradeStateAction,
    isAwaitingSubscription,
  );

  return (
    <WebhookWaitStatus
      isSlow={isSlow}
      isConfirmed={!isAwaitingSubscription(state)}
      confirming={{
        title: t('confirmingTitle'),
        description: t('confirmingDescription'),
      }}
      slow={{ title: t('slowTitle'), description: t('slowDescription') }}
      confirmed={{
        title: t('confirmedTitle'),
        description: t('confirmedDescription'),
      }}
      onCheckAgain={checkAgain}
    />
  );
};
