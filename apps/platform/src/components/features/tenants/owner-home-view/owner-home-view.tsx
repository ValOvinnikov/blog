import type { TMaybeUndefined } from '@blog/config';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { DomainCardSkeleton } from '@platform/components/features/tenants/domain-card-skeleton';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { TenantPageHeader } from '@platform/components/features/tenants/tenant-page-header';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import type { TDomainVerificationStatus } from '@platform/constants/domain';
import type { TGetStarted } from '@platform/server/onboarding/get-started-for';
import type { TSiteSetup } from '@platform/server/provisioning/site-setup-for';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTrial } from '@platform/utils/trial-for/trial-for';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { GetStartedCard } from './components/get-started-card/get-started-card';
import { MakeItYoursCard } from './components/make-it-yours-card/make-it-yours-card';
import { SiteSetupCard } from './components/site-setup-card/site-setup-card';
import { StreamedDomainCard } from './components/streamed-domain-card/streamed-domain-card';
import { TrialNotice } from './components/trial-notice/trial-notice';
import { YourSiteCard } from './components/your-site-card/your-site-card';
import { ownerHomeViewVariants } from './owner-home-view-variants';

export type TOwnerHomeViewProps = {
  tenant: TTenant;
  domainVerificationStatus: Promise<TDomainVerificationStatus>;
  owner: TMaybeUndefined<TTenantOwnerMembership>;
  siteSetup?: TSiteSetup;
  getStarted?: TGetStarted;
  trial?: TTrial;
  canUpgrade?: boolean;
};

export const OwnerHomeView = ({
  tenant,
  domainVerificationStatus,
  owner,
  siteSetup,
  getStarted,
  trial,
  canUpgrade = false,
}: TOwnerHomeViewProps) => {
  const tOwnerHome = useTranslations('ownerHomePage');
  const { root, pair } = ownerHomeViewVariants();

  return (
    <div className={root()}>
      <TenantPageHeader
        tenant={tenant}
        description={tOwnerHome('description')}
        hasPlanBadge={false}
      />

      {tenant.deprovisionedAt && (
        <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
      )}

      {trial && <TrialNotice trial={trial} canUpgrade={canUpgrade} />}

      {siteSetup && <SiteSetupCard siteSetup={siteSetup} />}

      {getStarted && <GetStartedCard getStarted={getStarted} />}

      <YourSiteCard tenant={tenant} />

      <div className={pair()}>
        <Suspense fallback={<DomainCardSkeleton isStackedToLg={true} />}>
          <StreamedDomainCard
            tenant={tenant}
            domainVerificationStatus={domainVerificationStatus}
            dnsHref={adminRoutes.dashboardDomain()}
            isStackedToLg={true}
          />
        </Suspense>
        <OwnerCard owner={owner} isStackedToLg={true} />
      </div>

      <MakeItYoursCard />
    </div>
  );
};
