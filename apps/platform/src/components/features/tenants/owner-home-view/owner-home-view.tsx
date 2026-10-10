import type { TTenant } from '@blog/db/schema/tenants';
import { DomainCardSkeleton } from '@platform/components/features/tenants/domain-card-skeleton';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TDomainVerificationStatus } from '@platform/constants/domain';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { MakeItYoursCard } from './components/make-it-yours-card/make-it-yours-card';
import { StreamedDomainCard } from './components/streamed-domain-card/streamed-domain-card';
import { YourSiteCard } from './components/your-site-card/your-site-card';
import { ownerHomeViewVariants } from './owner-home-view-variants';

export type TOwnerHomeViewProps = {
  tenant: TTenant;
  domainVerificationStatus: Promise<TDomainVerificationStatus>;
  ownerEmail: string | undefined;
  ownerJoinedAt: string | undefined;
  ownerJoinedAtIso: string | undefined;
};

export const OwnerHomeView = ({
  tenant,
  domainVerificationStatus,
  ownerEmail,
  ownerJoinedAt,
  ownerJoinedAtIso,
}: TOwnerHomeViewProps) => {
  const tTenantsTable = useTranslations('tenantsTable');
  const t = useTranslations('tenantOverviewPage');
  const tOwnerHome = useTranslations('ownerHomePage');
  const { root, cardsStack } = ownerHomeViewVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={tenant.name}
        description={tOwnerHome('description')}
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
        <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
      )}

      <YourSiteCard tenant={tenant} />

      <div className={cardsStack()}>
        <Suspense fallback={<DomainCardSkeleton />}>
          <StreamedDomainCard
            tenant={tenant}
            domainVerificationStatus={domainVerificationStatus}
            dnsHref={adminRoutes.dashboardDomain()}
          />
        </Suspense>
        <OwnerCard
          ownerEmail={ownerEmail}
          ownerJoinedAt={ownerJoinedAt}
          ownerJoinedAtIso={ownerJoinedAtIso}
        />
      </div>

      <MakeItYoursCard />
    </div>
  );
};
