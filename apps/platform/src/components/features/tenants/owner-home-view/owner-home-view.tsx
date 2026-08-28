import type { TTenant } from '@blog/db/schema/tenants';
import { DomainCard } from '@platform/components/features/tenants/domain-card';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import { MakeItYoursCard } from './components/make-it-yours-card/make-it-yours-card';
import { YourSiteCard } from './components/your-site-card/your-site-card';
import { ownerHomeViewVariants } from './owner-home-view-variants';

export type TOwnerHomeViewProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  ownerEmail: string | undefined;
  ownerJoinedAt: string | undefined;
  ownerJoinedAtIso: string | undefined;
};

/**
 * The owner-facing counterpart to `TenantOverviewView`: the same site-facts
 * cards (Domain, Owner), but a read-only identity card in place of the
 * editable details panel, no provisioning/platform cards, and a "Make it
 * yours" row routing on to Look, Voice and Features. Rendered on
 * `/dashboard` regardless of whether the viewer is a real `OWNER` member or
 * a platform SUPERADMIN browsing via their virtual membership — either way,
 * this is the owner tree's content.
 */
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
          <ExternalLinkButton href={`https://${tenant.primaryDomain}`}>
            {t('openSiteAction')}
          </ExternalLinkButton>
        }
      />

      <YourSiteCard tenant={tenant} />

      <div className={cardsStack()}>
        <DomainCard
          tenant={tenant}
          domainVerificationStatus={domainVerificationStatus}
          dnsHref={adminRoutes.dashboardDomain()}
        />
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
