import type { TMaybeUndefined } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { ConnectCustomDomainForm } from '@platform/components/features/tenants/domain-page-content/components/connect-custom-domain-form/connect-custom-domain-form';
import { CustomDomainStatusRefresher } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-status-refresher/custom-domain-status-refresher';
import { DomainVerificationCard } from '@platform/components/features/tenants/domain-page-content/components/domain-verification-card/domain-verification-card';
import { DomainVerificationCardSkeleton } from '@platform/components/features/tenants/domain-page-content/components/domain-verification-card-skeleton/domain-verification-card-skeleton';
import { RemoveCustomDomainControl } from '@platform/components/features/tenants/domain-page-content/components/remove-custom-domain-control/remove-custom-domain-control';
import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

export type TCustomDomainCardProps = {
  tenant: Pick<TTenant, 'id' | 'plan' | 'deprovisionedAt'>;
  customDomain: TMaybeUndefined<string>;
};

export const CustomDomainCard = ({
  tenant,
  customDomain,
}: TCustomDomainCardProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { id, plan, deprovisionedAt } = tenant;
  const isArchived = Boolean(deprovisionedAt);

  if (customDomain) {
    const projectDomain = getProjectDomain(customDomain);

    return (
      <Suspense fallback={<DomainVerificationCardSkeleton />}>
        <DomainVerificationCard
          domain={customDomain}
          isPlatformAddress={false}
          projectDomain={projectDomain}
          title={t('title')}
          actions={
            !isArchived && (
              <RemoveCustomDomainControl tenantId={id} domain={customDomain} />
            )
          }
        />
        {!isArchived && (
          <CustomDomainStatusRefresher
            tenantId={id}
            initialStatus={projectDomain.then(({ status }) => status)}
          />
        )}
      </Suspense>
    );
  }

  if (!isArchived && plan === TENANT_PLAN.GROWTH) {
    return <ConnectCustomDomainForm tenantId={id} />;
  }

  return (
    <Card>
      <Card.Header title={t('title')} supportingText={t('supportingText')} />
      <Card.Body>
        <Text>{isArchived ? t('archivedState') : t('upgradePrompt')}</Text>
      </Card.Body>
    </Card>
  );
};
