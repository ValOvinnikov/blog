import { loadGraceLocks } from '@platform/server/billing/load-grace-locks';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { graceEndDate } from '@shinefold/db/utils/grace-end-date/grace-end-date';
import { hasGraceLocks } from '@shinefold/db/utils/grace-locks/grace-locks';

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
  const { id, plan, status, isArchived, downgradeGraceStartedAt } = tenant;

  if (status === TENANT_STATUS.PAST_DUE) {
    return canOpenBilling ? <PastDueNotice tenantId={id} plan={plan} /> : null;
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
