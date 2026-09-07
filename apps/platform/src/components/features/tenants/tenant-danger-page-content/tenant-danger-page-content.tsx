'use client';

import type { TTenant } from '@blog/db/schema/tenants';
import { DeprovisionTenantControl } from '@platform/components/features/tenants/deprovision-tenant-control';
import {
  DeprovisioningStatusView,
  useDeprovisioningPoll,
} from '@platform/components/features/tenants/deprovisioning-status-view';
import { ReactivateTenantControl } from '@platform/components/features/tenants/reactivate-tenant-control';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Heading } from '@platform/components/shared/heading';
import { PageHeader } from '@platform/components/shared/page-header';
import { useTranslations } from 'next-intl';

import { tenantDangerPageContentVariants } from './tenant-danger-page-content-variants';

export type TTenantDangerPageContentProps = {
  tenant: TTenant;
  deprovisionRequestedAt?: string;
};

/**
 * The danger page's client shell: it owns the single `useDeprovisioningPoll`
 * call for this tenant, so the deprovision trigger and the teardown-progress
 * view always agree on whether a run is in progress.
 */
export const TenantDangerPageContent = ({
  tenant,
  deprovisionRequestedAt,
}: TTenantDangerPageContentProps) => {
  const t = useTranslations('tenantDangerPage');
  const poll = useDeprovisioningPoll(tenant, deprovisionRequestedAt);
  const hasDeprovisioningRun = Boolean(tenant.deprovisioningSteps?.run);
  const showDeprovisioningStatus =
    hasDeprovisioningRun || Boolean(deprovisionRequestedAt);
  // `poll.isRunning` alone reads the same for "genuinely in flight" and
  // "never deprovisioned" — gate it on a run actually existing or requested.
  const isDeprovisioningInProgress = showDeprovisioningStatus && poll.isRunning;

  const { root, actionsRow, historySection } =
    tenantDangerPageContentVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />

      {tenant.deprovisionedAt ? (
        <>
          <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
          <div className={actionsRow()}>
            <ReactivateTenantControl tenant={tenant} />
            <DeprovisionTenantControl tenant={tenant} />
          </div>
          {showDeprovisioningStatus && (
            <div className={historySection()}>
              <Heading level={2} size="cardTitle">
                {t('historyHeading')}
              </Heading>
              <DeprovisioningStatusView poll={poll} />
            </div>
          )}
        </>
      ) : (
        <>
          <DeprovisionTenantControl
            tenant={tenant}
            isDeprovisioningInProgress={isDeprovisioningInProgress}
          />
          {showDeprovisioningStatus && <DeprovisioningStatusView poll={poll} />}
        </>
      )}
    </div>
  );
};
