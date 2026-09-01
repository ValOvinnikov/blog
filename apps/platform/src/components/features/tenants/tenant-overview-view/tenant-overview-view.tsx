'use client';

import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TTenant } from '@blog/db/schema/tenants';
import { ContentWorkspaceCard } from '@platform/components/features/tenants/content-workspace-card';
import { DomainCard } from '@platform/components/features/tenants/domain-card';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { ProvisioningBanner } from '@platform/components/features/tenants/provisioning-banner';
import { useProvisioningPoll } from '@platform/components/features/tenants/provisioning-status-view/use-provisioning-poll';
import { RecentActivityCard } from '@platform/components/features/tenants/recent-activity-card';
import { TenantDetailsPanel } from '@platform/components/features/tenants/tenant-details-panel';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { computeTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

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
  const t = useTranslations('tenantOverviewPage');
  const archivedNoticeId = useId();
  const { root, cardsGrid, cardsColumn } = tenantOverviewViewVariants();
  const {
    provisioningStatus,
    provisioningSteps,
    effectiveProvisioningStatus,
    stepStatuses,
    isOverallFailed,
    isProvisioningRunning,
    errorKind,
    ownerElevationOutcome,
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
        actions={
          <ExternalLinkButton href={`https://${tenant.primaryDomain}`}>
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
          effectiveProvisioningStatus,
        )}
        ownerEmail={ownerEmail}
        archivedNoticeId={archivedNoticeId}
      />

      <div className={cardsGrid()}>
        <div className={cardsColumn()}>
          <DomainCard
            tenant={tenant}
            domainVerificationStatus={domainVerificationStatus}
            dnsHref={adminRoutes.tenantDomain(tenant.id)}
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
