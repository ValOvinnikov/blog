import { AUDIT_TARGET_TYPE, FINDING_STATUS } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { ContentWorkspaceCard } from '@platform/components/features/tenants/content-workspace-card';
import { DomainCardSkeleton } from '@platform/components/features/tenants/domain-card-skeleton';
import { FindingsCard } from '@platform/components/features/tenants/findings-card';
import { LiveDomainCard } from '@platform/components/features/tenants/live-domain-card';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { RecentActivityCard } from '@platform/components/features/tenants/recent-activity-card';
import { TenantPageHeader } from '@platform/components/features/tenants/tenant-page-header';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { Suspense } from 'react';

import { TenantProvisioningSection } from './components/tenant-provisioning-section/tenant-provisioning-section';
import { tenantOverviewViewVariants } from './tenant-overview-view-variants';

export type TTenantOverviewViewProps = {
  tenant: TTenant;
};

export const TenantOverviewView = async ({
  tenant,
}: TTenantOverviewViewProps) => {
  const { id, primaryDomain } = tenant;
  const clientTenant = toClientTenant(tenant);
  const domainVerificationStatus = getDomainVerificationStatus(primaryDomain);
  const [owner, auditEvents, findings] = await Promise.all([
    queries.memberships.getTenantOwnerMembership(id),
    queries.auditEvents.listAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, id, {
      limit: 5,
    }),
    queries.findings.listFindingsForTenant(id, FINDING_STATUS.OPEN),
  ]);
  const { root, cardsGrid, cardsColumn } = tenantOverviewViewVariants();

  return (
    <div className={root()}>
      <TenantPageHeader tenant={tenant} />

      <TenantProvisioningSection tenant={clientTenant} owner={owner} />

      <FindingsCard tenantId={id} findings={findings} />

      <div className={cardsGrid()}>
        <div className={cardsColumn()}>
          <Suspense fallback={<DomainCardSkeleton />}>
            <LiveDomainCard
              tenant={clientTenant}
              domainVerificationStatus={domainVerificationStatus}
              dnsHref={adminRoutes.tenantDomain(id)}
            />
          </Suspense>
          <OwnerCard owner={owner} />
        </div>
        <div className={cardsColumn()}>
          <ContentWorkspaceCard tenant={clientTenant} />
          <RecentActivityCard events={auditEvents} />
        </div>
      </div>
    </div>
  );
};
