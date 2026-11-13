import { AUDIT_TARGET_TYPE, FINDING_STATUS } from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { isNull, isUndefined } from '@blog/utils/primitives';
import { ContentWorkspaceCard } from '@platform/components/features/tenants/content-workspace-card';
import { FindingsCard } from '@platform/components/features/tenants/findings-card';
import { LiveDomainCard } from '@platform/components/features/tenants/live-domain-card';
import { NewsletterPauseCard } from '@platform/components/features/tenants/newsletter-pause-card';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { PlatformTenantNotice } from '@platform/components/features/tenants/platform-tenant-notice';
import { RecentActivityCard } from '@platform/components/features/tenants/recent-activity-card';
import { TenantOverviewFocusProvider } from '@platform/components/features/tenants/tenant-overview-focus-provider';
import { TenantOverviewHeader } from '@platform/components/features/tenants/tenant-overview-header';
import { TenantSuspensionControl } from '@platform/components/features/tenants/tenant-suspension-control';
import { DetailCardSkeleton } from '@platform/components/shared/detail-card-skeleton';
import { DOMAIN_CARD_ROW_COUNT } from '@platform/constants/domain';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { loadOperatorSuspension } from '@platform/server/tenants/load-operator-suspension';
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
  const {
    id,
    primaryDomain,
    status,
    deprovisionedAt,
    unsentReinviteFormerOwnerEmailEncrypted,
    name,
    plan,
  } = tenant;
  const clientTenant = toClientTenant(tenant);
  const domainVerificationStatus = getDomainVerificationStatus(primaryDomain);
  const [admin, owner, auditEvents, findings, suspension, newsletterPausedAt] =
    await Promise.all([
      requireAdmin(),
      queries.memberships.getTenantOwnerMembership(id),
      queries.auditEvents.listAuditEventsForTarget(
        AUDIT_TARGET_TYPE.TENANT,
        id,
        { limit: 5 },
      ),
      queries.findings.listFindingsForTenant(id, FINDING_STATUS.OPEN),
      loadOperatorSuspension(tenant),
      queries.emailConfig.getNewsletterPausedAt(id),
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
    <TenantOverviewFocusProvider>
      <div className={root()}>
        <TenantOverviewHeader tenant={{ name, status, plan, primaryDomain }} />

        <TenantProvisioningSection
          tenant={clientTenant}
          owner={owner}
          isPrimaryCustom={isCustomDomain(
            primaryDomain,
            env.TENANT_ROOT_DOMAIN,
          )}
          isStudioReinviteUnsent={
            !isNull(unsentReinviteFormerOwnerEmailEncrypted)
          }
        />

        <FindingsCard tenantId={id} findings={findings} />

        <div className={cardsGrid()}>
          <div className={cardsColumn()}>
            <Suspense
              fallback={<DetailCardSkeleton rowCount={DOMAIN_CARD_ROW_COUNT} />}
            >
              <LiveDomainCard
                tenant={clientTenant}
                domainVerificationStatus={domainVerificationStatus}
                dnsHref={adminRoutes.tenantDomain(id)}
              />
            </Suspense>
            <OwnerCard owner={owner} />
            {!isUndefined(newsletterPausedAt) && (
              <NewsletterPauseCard
                tenantId={id}
                pausedAt={newsletterPausedAt}
                canClear={isSuperAdmin(admin)}
              />
            )}
            {canChangeSuspension &&
              (isSuspensionControlShown ? (
                <TenantSuspensionControl
                  tenant={clientTenant}
                  suspension={suspension}
                />
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
    </TenantOverviewFocusProvider>
  );
};
