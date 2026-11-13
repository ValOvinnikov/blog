import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { graceEndDate } from '@blog/db/utils/grace-end-date/grace-end-date';
import {
  hasGraceLocks,
  loadGraceLocks,
} from '@platform/server/billing/load-grace-locks';

import { GraceNotice } from './components/grace-notice/grace-notice';
import { PastDueNotice } from './components/past-due-notice/past-due-notice';

export type TBillingStatusNoticeProps = {
  tenant: Pick<
    TTenant,
    | 'id'
    | 'plan'
    | 'status'
    | 'primaryDomain'
    | 'deprovisionedAt'
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
  const { plan, status, deprovisionedAt, downgradeGraceStartedAt } = tenant;

  if (status === TENANT_STATUS.PAST_DUE) {
    return canOpenBilling ? <PastDueNotice plan={plan} /> : null;
  }
  if (deprovisionedAt || !downgradeGraceStartedAt) return null;

  const locks = await loadGraceLocks(tenant);
  if (!hasGraceLocks(locks)) return null;

  return (
    <GraceNotice
      plan={plan}
      endsAt={graceEndDate(downgradeGraceStartedAt)}
      locks={locks}
      canUpgrade={canUpgrade}
    />
  );
};
