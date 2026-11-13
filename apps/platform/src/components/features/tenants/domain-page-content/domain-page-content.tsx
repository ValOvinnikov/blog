import { queries } from '@blog/db';
import { CustomDomainCard } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-card/custom-domain-card';
import { MainAddressSignInAppsProvider } from '@platform/components/features/tenants/domain-page-content/components/main-address-sign-in-apps-provider/main-address-sign-in-apps-provider';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { listOwnSignInAppProviders } from '@platform/server/sign-in-apps/list-own-sign-in-app-providers';
import { env } from '@platform/utils/env/env';
import { findCustomDomain } from '@platform/utils/find-custom-domain/find-custom-domain';
import { findSubdomain } from '@platform/utils/find-subdomain/find-subdomain';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';
import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { DomainVerificationCard } from './components/domain-verification-card/domain-verification-card';
import { DomainVerificationCardSkeleton } from './components/domain-verification-card-skeleton/domain-verification-card-skeleton';
import { domainPageContentVariants } from './domain-page-content-variants';

export type TDomainPageContentProps = {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
};

export const DomainPageContent = async ({
  tenant,
  viewer,
}: TDomainPageContentProps) => {
  const { id, primaryDomain, archivedAt } = tenant;
  const projectDomain = getProjectDomain(primaryDomain);
  const [t, tenantDomains, claim, signInAppProviders] = await Promise.all([
    getTranslations('tenantDomainPage'),
    queries.tenantDomains.listTenantDomains(id),
    queries.customDomainClaims.getCustomDomainClaim(id),
    listOwnSignInAppProviders(tenant),
  ]);
  const customDomain = findCustomDomain(
    tenantDomains,
    primaryDomain,
    env.TENANT_ROOT_DOMAIN,
  );
  const subdomain = findSubdomain(tenantDomains, env.TENANT_ROOT_DOMAIN);
  const { root } = domainPageContentVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('pageTitle')} description={t('subCopy')} />

      {archivedAt && <ArchivedTenantNotice archivedAt={archivedAt} />}

      <Suspense fallback={<DomainVerificationCardSkeleton />}>
        <DomainVerificationCard
          domain={primaryDomain}
          isPlatformAddress={isPlatformAddress(
            primaryDomain,
            env.TENANT_ROOT_DOMAIN,
          )}
          projectDomain={projectDomain}
        />
      </Suspense>

      <MainAddressSignInAppsProvider providers={signInAppProviders}>
        <CustomDomainCard
          tenant={tenant}
          customDomain={customDomain}
          subdomain={subdomain}
          claim={claim}
          primaryProjectDomain={projectDomain}
          isPrimaryCustom={isCustomDomain(
            primaryDomain,
            env.TENANT_ROOT_DOMAIN,
          )}
          canManage={viewer.canManage}
        />
      </MainAddressSignInAppsProvider>
    </div>
  );
};
