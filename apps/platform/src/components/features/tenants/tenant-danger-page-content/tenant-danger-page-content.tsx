'use client';

import { DeleteTenantControl } from '@platform/components/features/tenants/delete-tenant-control';
import { DeprovisionTenantControl } from '@platform/components/features/tenants/deprovision-tenant-control';
import { DeprovisioningStatusView } from '@platform/components/features/tenants/deprovisioning-status-view';
import { PlatformTenantNotice } from '@platform/components/features/tenants/platform-tenant-notice';
import { ReactivateTenantControl } from '@platform/components/features/tenants/reactivate-tenant-control';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Heading } from '@platform/components/shared/heading';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { useDeprovisioningPoll } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';
import { useTranslations } from 'next-intl';

import { tenantDangerPageContentVariants } from './tenant-danger-page-content-variants';

export type TTenantDangerPageContentProps = {
  tenant: TClientTenant;
  deprovisionRequestedAt?: string;
  isPlatformTenant?: boolean;
};

export const TenantDangerPageContent = ({
  tenant,
  deprovisionRequestedAt,
  isPlatformTenant = false,
}: TTenantDangerPageContentProps) => {
  const t = useTranslations('tenantDangerPage');
  const showDeprovisioningStatus =
    Boolean(tenant.deprovisioningSteps?.run) || Boolean(deprovisionRequestedAt);
  const poll = useDeprovisioningPoll(tenant, {
    isEnabled: showDeprovisioningStatus,
    deprovisionRequestedAt,
  });

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
            <DeleteTenantControl tenant={tenant} />
          </div>
          {showDeprovisioningStatus && (
            <div className={historySection()}>
              <Heading level={2} size="cardTitle">
                {t('historyHeading')}
              </Heading>
              <DeprovisioningStatusView poll={poll} headingLevel={3} />
            </div>
          )}
        </>
      ) : isPlatformTenant ? (
        <PlatformTenantNotice />
      ) : (
        <>
          <DeprovisionTenantControl
            tenant={tenant}
            isDeprovisioningInProgress={poll.isInProgress}
          />
          {showDeprovisioningStatus && <DeprovisioningStatusView poll={poll} />}
        </>
      )}
    </div>
  );
};
