import type { TTenant } from '@blog/db/schema/tenants';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { DomainVerificationCard } from './components/domain-verification-card/domain-verification-card';
import { DomainVerificationCardSkeleton } from './components/domain-verification-card-skeleton/domain-verification-card-skeleton';
import { domainPageContentVariants } from './domain-page-content-variants';

export type TDomainPageContentProps = {
  tenant: TTenant;
};

export const DomainPageContent = async ({
  tenant,
}: TDomainPageContentProps) => {
  const { primaryDomain, deprovisionedAt } = tenant;
  const projectDomain = getProjectDomain(primaryDomain);
  const t = await getTranslations('tenantDomainPage');
  const { root } = domainPageContentVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('pageTitle')} description={t('subCopy')} />

      {deprovisionedAt && <ArchivedTenantNotice archivedAt={deprovisionedAt} />}

      <Suspense fallback={<DomainVerificationCardSkeleton />}>
        <DomainVerificationCard
          domain={primaryDomain}
          projectDomain={projectDomain}
        />
      </Suspense>
    </div>
  );
};
