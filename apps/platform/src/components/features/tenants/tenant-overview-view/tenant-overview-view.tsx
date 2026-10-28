import { AUDIT_TARGET_TYPE, FINDING_STATUS } from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { ContentWorkspaceCard } from '@platform/components/features/tenants/content-workspace-card';
import { DomainCardSkeleton } from '@platform/components/features/tenants/domain-card-skeleton';
import { FindingsCard } from '@platform/components/features/tenants/findings-card';
import { LiveDomainCard } from '@platform/components/features/tenants/live-domain-card';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { PlatformTenantNotice } from '@platform/components/features/tenants/platform-tenant-notice';
import { RecentActivityCard } from '@platform/components/features/tenants/recent-activity-card';
import { TenantPageHeader } from '@platform/components/features/tenants/tenant-page-header';
import { TenantSuspensionControl } from '@platform/components/features/tenants/tenant-suspension-control';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import { env } from '@platform/utils/env/env';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';
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
  const { id, primaryDomain, status, deprovisionedAt } = tenant;
  const clientTenant = toClientTenant(tenant);
  const domainVerificationStatus = getDomainVerificationStatus(primaryDomain);
  const [admin, owner, auditEvents, findings] = await Promise.all([
    requireAdmin(),
    queries.memberships.getTenantOwnerMembership(id),
    queries.auditEvents.listAuditEventsForTarget(AUDIT_TARGET_TYPE.TENANT, id, {
      limit: 5,
    }),
    queries.findings.listFindingsForTenant(id, FINDING_STATUS.OPEN),
  ]);
  const canChangeSuspension =
    isSuperAdmin(admin) &&
    !deprovisionedAt &&
    status !== TENANT_STATUS.ARCHIVED;
  const isSuspensionControlShown =
    canChangeSuspension &&
    (status === TENANT_STATUS.SUSPENDED ||
      !(await resolveIsPlatformTenant(tenant)));
  const { root, cardsGrid, cardsColumn } = tenantOverviewViewVariants();

  return (
    <div className={root()}>
      <TenantPageHeader tenant={tenant} />

      <TenantProvisioningSection
        tenant={clientTenant}
        owner={owner}
        isPrimaryCustom={isCustomDomain(primaryDomain, env.TENANT_ROOT_DOMAIN)}
      />

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
          {canChangeSuspension &&
            (isSuspensionControlShown ? (
              <TenantSuspensionControl tenant={clientTenant} />
            ) : (
              <PlatformTenantNotice />
            ))}
        </div>
        <div className={cardsColumn()}>
          <ContentWorkspaceCard tenant={clientTenant} />
          <RecentActivityCard
            events={auditEvents}
            viewAllHref={adminRoutes.tenantActivity(id)}
          />
        </div>
      </div>
    </div>
  );
};
