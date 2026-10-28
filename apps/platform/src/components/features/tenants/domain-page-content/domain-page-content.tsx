import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { CustomDomainCard } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-card/custom-domain-card';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { env } from '@platform/utils/env/env';
import { findCustomDomain } from '@platform/utils/find-custom-domain/find-custom-domain';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';
import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { DomainVerificationCard } from './components/domain-verification-card/domain-verification-card';
import { DomainVerificationCardSkeleton } from './components/domain-verification-card-skeleton/domain-verification-card-skeleton';
import { domainPageContentVariants } from './domain-page-content-variants';

export type TDomainPageContentProps = {
  tenant: TTenant;
  membership?: TMembership;
  admin?: TAdmin;
};

export const DomainPageContent = async ({
  tenant,
  membership,
  admin,
}: TDomainPageContentProps) => {
  const { id, primaryDomain, deprovisionedAt } = tenant;
  const projectDomain = getProjectDomain(primaryDomain);
  const [t, tenantDomains, claim] = await Promise.all([
    getTranslations('tenantDomainPage'),
    queries.tenantDomains.listTenantDomains(id),
    queries.customDomainClaims.getCustomDomainClaim(id),
  ]);
  const customDomain = findCustomDomain(
    tenantDomains,
    primaryDomain,
    env.TENANT_ROOT_DOMAIN,
  );
  const { root } = domainPageContentVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('pageTitle')} description={t('subCopy')} />

      {deprovisionedAt && <ArchivedTenantNotice archivedAt={deprovisionedAt} />}

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

      <CustomDomainCard
        tenant={tenant}
        customDomain={customDomain}
        claim={claim}
        primaryProjectDomain={projectDomain}
        isPrimaryCustom={isCustomDomain(primaryDomain, env.TENANT_ROOT_DOMAIN)}
        canManage={
          Boolean(admin) || (membership ? isTenantOwner(membership) : false)
        }
      />
    </div>
  );
};
