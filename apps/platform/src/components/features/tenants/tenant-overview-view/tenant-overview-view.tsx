'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TFindingSummary } from '@blog/db/schema/findings';
import { ContentWorkspaceCard } from '@platform/components/features/tenants/content-workspace-card';
import { FindingsCard } from '@platform/components/features/tenants/findings-card';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { ProvisioningBanner } from '@platform/components/features/tenants/provisioning-banner';
import { useProvisioningPoll } from '@platform/components/features/tenants/provisioning-status-view/use-provisioning-poll';
import { RecentActivityCard } from '@platform/components/features/tenants/recent-activity-card';
import { TenantDetailsPanel } from '@platform/components/features/tenants/tenant-details-panel';
import { TenantPageHeader } from '@platform/components/features/tenants/tenant-page-header';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { computeTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useId, type ReactNode } from 'react';

import { tenantOverviewViewVariants } from './tenant-overview-view-variants';

export type TTenantOverviewViewProps = {
  tenant: TClientTenant;
  domainCard: ReactNode;
  ownerEmail: TMaybeUndefined<string>;
  ownerJoinedAt: TMaybeUndefined<string>;
  ownerJoinedAtIso: TMaybeUndefined<string>;
  auditEvents: TAuditEvent[];
  findings: TFindingSummary[];
};

// One poll instance feeds both the banner and the field locks so they never disagree.
export const TenantOverviewView = ({
  tenant,
  domainCard,
  ownerEmail,
  ownerJoinedAt,
  ownerJoinedAtIso,
  auditEvents,
  findings,
}: TTenantOverviewViewProps) => {
  const archivedNoticeId = useId();
  const { root, cardsGrid, cardsColumn } = tenantOverviewViewVariants();
  const {
    provisioningStatus,
    provisioningSteps,
    stepStatuses,
    isOverallFailed,
    isProvisioningRunning,
    errorKind,
    ownerElevationOutcome,
  } = useProvisioningPoll(tenant);

  return (
    <div className={root()}>
      <TenantPageHeader tenant={tenant} />

      {tenant.deprovisionedAt && (
        <ArchivedTenantNotice
          id={archivedNoticeId}
          archivedAt={tenant.deprovisionedAt}
        />
      )}

      <ProvisioningBanner
        tenantId={tenant.id}
        provisioningStatus={provisioningStatus}
        stepStatuses={stepStatuses}
        isOverallFailed={isOverallFailed}
        isProvisioningRunning={isProvisioningRunning}
        errorKind={errorKind}
        ownerElevationOutcome={ownerElevationOutcome}
      />

      <TenantDetailsPanel
        tenant={tenant}
        fieldLocks={computeTenantFieldLocks(
          provisioningSteps,
          provisioningStatus,
        )}
        ownerEmail={ownerEmail}
        archivedNoticeId={archivedNoticeId}
      />

      <FindingsCard tenantId={tenant.id} findings={findings} />

      <div className={cardsGrid()}>
        <div className={cardsColumn()}>
          {domainCard}
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
