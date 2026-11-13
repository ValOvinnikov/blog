import type { TMaybeUndefined } from '@blog/config';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { TenantPageHeader } from '@platform/components/features/tenants/tenant-page-header';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { DetailCardSkeleton } from '@platform/components/shared/detail-card-skeleton';
import {
  type TDomainVerificationStatus,
  DOMAIN_CARD_ROW_COUNT,
} from '@platform/constants/domain';
import type { TGetStarted } from '@platform/server/onboarding/get-started-for';
import type { TSiteSetup } from '@platform/server/provisioning/site-setup-for';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
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
  tenant: TPlatformTenant;
  domainVerificationStatus: Promise<TDomainVerificationStatus>;
  owner: TMaybeUndefined<TTenantOwnerMembership>;
  siteSetup?: TSiteSetup;
  getStarted?: TGetStarted;
  canUpgrade?: boolean;
};

export const OwnerHomeView = ({
  tenant,
  domainVerificationStatus,
  owner,
  siteSetup,
  getStarted,
  canUpgrade = false,
}: TOwnerHomeViewProps) => {
  const tOwnerHome = useTranslations('ownerHomePage');
  const { archivedAt, trial } = tenant;
  const { root, pair } = ownerHomeViewVariants();

  return (
    <div className={root()}>
      <TenantPageHeader
        tenant={tenant}
        description={tOwnerHome('description')}
        hasPlanBadge={false}
      />

      {archivedAt && <ArchivedTenantNotice archivedAt={archivedAt} />}

      {trial && <TrialNotice trial={trial} canUpgrade={canUpgrade} />}

      {siteSetup && <SiteSetupCard siteSetup={siteSetup} />}

      {getStarted && <GetStartedCard getStarted={getStarted} />}

      <YourSiteCard tenant={tenant} />

      <div className={pair()}>
        <Suspense
          fallback={
            <DetailCardSkeleton
              rowCount={DOMAIN_CARD_ROW_COUNT}
              isStackedToLg={true}
            />
          }
        >
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
