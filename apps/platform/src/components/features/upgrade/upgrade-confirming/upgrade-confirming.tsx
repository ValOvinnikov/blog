'use client';

import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
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

export type TUpgradeConfirmingProps = {
  tenantId: string;
  initialState: TUpgradeState;
};

const isAwaitingGrowth = (state: TUpgradeState) =>
  state !== UPGRADE_STATE.ON_GROWTH;

export const UpgradeConfirming = ({
  tenantId,
  initialState,
}: TUpgradeConfirmingProps) => {
  const t = useTranslations('upgradePage');
  const router = useRouter();

  usePolledValue(tenantId, initialState, getUpgradeStateAction, {
    intervalMs: UPGRADE_POLL.INTERVAL_MS,
    maxTicks: UPGRADE_POLL.MAX_TICKS,
    isActive: isAwaitingGrowth,
    onResult: (state) => {
      if (!isAwaitingGrowth(state)) router.refresh();
    },
  });

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      title={t('confirmingTitle')}
      description={t('confirmingDescription')}
      action={<Spinner label={t('confirmingTitle')} />}
    />
  );
};
