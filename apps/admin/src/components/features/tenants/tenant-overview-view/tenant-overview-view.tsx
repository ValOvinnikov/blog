'use client';

import { ContentWorkspaceCard } from '@admin/components/features/tenants/content-workspace-card';
import { DomainCard } from '@admin/components/features/tenants/domain-card';
import { OwnerCard } from '@admin/components/features/tenants/owner-card';
import { ProvisioningBanner } from '@admin/components/features/tenants/provisioning-banner';
import { useProvisioningPoll } from '@admin/components/features/tenants/provisioning-status-view/use-provisioning-poll';
import { RecentActivityCard } from '@admin/components/features/tenants/recent-activity-card';
import { TenantDetailsPanel } from '@admin/components/features/tenants/tenant-details-panel';
import { PageHeader } from '@admin/components/shared/page-header';
import { StatusBadge } from '@admin/components/shared/status-badge';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { tenantStatusTone } from '@admin/utils/status-tone/status-tone';
import { computeTenantFieldLocks } from '@admin/utils/tenant-field-locks/tenant-field-locks';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

import { tenantOverviewViewVariants } from './tenant-overview-view-variants';

export type TTenantOverviewViewProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  ownerEmail: string | undefined;
  ownerJoinedAt: string | undefined;
  ownerJoinedAtIso: string | undefined;
  auditEvents: TAuditEvent[];
};

/**
 * The platform operator's landing page for a single tenant: the
 * provisioning banner, the editable details panel (moved here from the
 * provisioning page), and four read-only fact cards. A single
 * `useProvisioningPoll` instance is lifted up here and shared by the banner
 * and the details panel's field locks, so the two never disagree about
 * provisioning status the way two independent poll instances could.
 */
export const TenantOverviewView = ({
  tenant,
  domainVerificationStatus,
  ownerEmail,
  ownerJoinedAt,
  ownerJoinedAtIso,
  auditEvents,
}: TTenantOverviewViewProps) => {
  const tTenantsTable = useTranslations('tenantsTable');
  const { root, cardsGrid, cardsColumn } = tenantOverviewViewVariants();
  const {
    provisioningStatus,
    provisioningSteps,
    effectiveProvisioningStatus,
    stepStatuses,
    isOverallFailed,
    isProvisioningRunning,
    errorKind,
  } = useProvisioningPoll(tenant, domainVerificationStatus);

  return (
    <div className={root()}>
      <PageHeader
        title={tenant.name}
        badges={
          <>
            <StatusBadge tone={tenantStatusTone(tenant.status)}>
              {tTenantsTable(`status.${tenant.status}`)}
            </StatusBadge>
            <StatusBadge tone="plan" hasDot={false}>
              {tTenantsTable(`plan.${tenant.plan}`)}
            </StatusBadge>
          </>
        }
      />

      <ProvisioningBanner
        tenantId={tenant.id}
        provisioningStatus={provisioningStatus}
        stepStatuses={stepStatuses}
        isOverallFailed={isOverallFailed}
        isProvisioningRunning={isProvisioningRunning}
        errorKind={errorKind}
      />

      <TenantDetailsPanel
        tenant={tenant}
        fieldLocks={computeTenantFieldLocks(
          provisioningSteps,
          effectiveProvisioningStatus,
        )}
        ownerEmail={ownerEmail}
      />

      <div className={cardsGrid()}>
        <div className={cardsColumn()}>
          <DomainCard
            tenant={tenant}
            domainVerificationStatus={domainVerificationStatus}
          />
          <OwnerCard
            ownerEmail={ownerEmail}
            ownerJoinedAt={ownerJoinedAt}
            ownerJoinedAtIso={ownerJoinedAtIso}
          />
        </div>
        <div className={cardsColumn()}>
          <ContentWorkspaceCard tenant={tenant} />
          <RecentActivityCard events={auditEvents} />
        </div>
      </div>
    </div>
  );
};
