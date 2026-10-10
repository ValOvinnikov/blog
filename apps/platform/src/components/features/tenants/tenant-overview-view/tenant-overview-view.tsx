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
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { computeTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useTranslations } from 'next-intl';
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
  const tTenantsTable = useTranslations('tenantsTable');
  const t = useTranslations('tenantOverviewPage');
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
        actions={
          <ExternalLinkButton
            href={`https://${tenant.primaryDomain}`}
            hasArrow={true}
          >
            {t('openSiteAction')}
          </ExternalLinkButton>
        }
      />

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
