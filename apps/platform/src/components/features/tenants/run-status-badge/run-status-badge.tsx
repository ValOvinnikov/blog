import type { TTenantProvisioningStepStatus } from '@blog/db/constants';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { provisioningStepTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import { runStatusBadgeVariants } from './run-status-badge-variants';

type TRunStatusBadgeProps = {
  status: TTenantProvisioningStepStatus;
  isPreRun?: boolean;
};

export const RunStatusBadge = ({
  status,
  isPreRun = false,
}: TRunStatusBadgeProps) => {
  const t = useTranslations('runStatus');
  return (
    <span
      className={runStatusBadgeVariants()}
      aria-live="polite"
      data-testid="run-status-live"
    >
      <StatusBadge tone={isPreRun ? 'warn' : provisioningStepTone(status)}>
        {isPreRun ? t('startingBadge') : t(`statusLabel.${status}`)}
      </StatusBadge>
    </span>
  );
};
