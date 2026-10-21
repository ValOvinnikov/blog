import type { TMaybeUndefined } from '@blog/config';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { DomainCardSkeleton } from '@platform/components/features/tenants/domain-card-skeleton';
import { OwnerCard } from '@platform/components/features/tenants/owner-card';
import { TenantPageHeader } from '@platform/components/features/tenants/tenant-page-header';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import type { TDomainVerificationStatus } from '@platform/constants/domain';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { MakeItYoursCard } from './components/make-it-yours-card/make-it-yours-card';
import {
  SiteSetupCard,
  type TSiteSetupCardProps,
} from './components/site-setup-card/site-setup-card';
import { StreamedDomainCard } from './components/streamed-domain-card/streamed-domain-card';
import { YourSiteCard } from './components/your-site-card/your-site-card';
import { ownerHomeViewVariants } from './owner-home-view-variants';

export type TOwnerHomeViewProps = {
  tenant: TTenant;
  domainVerificationStatus: Promise<TDomainVerificationStatus>;
  owner: TMaybeUndefined<TTenantOwnerMembership>;
  siteSetup?: TSiteSetupCardProps;
};

export const OwnerHomeView = ({
  tenant,
  domainVerificationStatus,
  owner,
  siteSetup,
}: TOwnerHomeViewProps) => {
  const tOwnerHome = useTranslations('ownerHomePage');
  const { root, cardsStack } = ownerHomeViewVariants();

  return (
    <div className={root()}>
      <TenantPageHeader
        tenant={tenant}
        description={tOwnerHome('description')}
      />

      {tenant.deprovisionedAt && (
        <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
      )}

      {siteSetup && <SiteSetupCard {...siteSetup} />}

      <YourSiteCard tenant={tenant} />

      <div className={cardsStack()}>
        <Suspense fallback={<DomainCardSkeleton />}>
          <StreamedDomainCard
            tenant={tenant}
            domainVerificationStatus={domainVerificationStatus}
            dnsHref={adminRoutes.dashboardDomain()}
          />
        </Suspense>
        <OwnerCard owner={owner} />
      </div>

      <MakeItYoursCard />
    </div>
  );
};
