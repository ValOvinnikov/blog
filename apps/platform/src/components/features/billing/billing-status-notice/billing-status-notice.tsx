import { TENANT_STATUS } from '@blog/db/constants';
import { graceEndDate } from '@blog/db/utils/grace-end-date/grace-end-date';
import { hasGraceLocks } from '@blog/db/utils/grace-locks/grace-locks';
import { loadGraceLocks } from '@platform/server/billing/load-grace-locks';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

import { GraceNotice } from './components/grace-notice/grace-notice';
import { PastDueNotice } from './components/past-due-notice/past-due-notice';

export type TBillingStatusNoticeProps = {
  tenant: Pick<
    TPlatformTenant,
    | 'id'
    | 'plan'
    | 'status'
    | 'primaryDomain'
    | 'isArchived'
    | 'entitlements'
    | 'downgradeGraceStartedAt'
  >;
  canOpenBilling: boolean;
  canUpgrade: boolean;
};

export const BillingStatusNotice = async ({
  tenant,
  canOpenBilling,
  canUpgrade,
}: TBillingStatusNoticeProps) => {
  const { plan, status, isArchived, downgradeGraceStartedAt } = tenant;

  if (status === TENANT_STATUS.PAST_DUE) {
    return canOpenBilling ? <PastDueNotice plan={plan} /> : null;
  }
  if (isArchived || !downgradeGraceStartedAt) return null;

  const locks = await loadGraceLocks(tenant);
  if (!locks || !hasGraceLocks(locks)) return null;

  return (
    <GraceNotice
      plan={plan}
      endsAt={graceEndDate(downgradeGraceStartedAt)}
      locks={locks}
      canUpgrade={canUpgrade}
    />
  );
};
