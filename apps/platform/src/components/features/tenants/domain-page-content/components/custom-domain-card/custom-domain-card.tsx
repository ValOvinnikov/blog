import type { TMaybeUndefined } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import type { TCustomDomainClaim } from '@blog/db/schema/custom-domain-claims';
import type { TTenant } from '@blog/db/schema/tenants';
import { ConnectCustomDomainForm } from '@platform/components/features/tenants/domain-page-content/components/connect-custom-domain-form/connect-custom-domain-form';
import { CustomDomainClaimCard } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-claim-card/custom-domain-claim-card';
import { CustomDomainFocusProvider } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/custom-domain-focus-provider';
import { CustomDomainNoticeCard } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-notice-card/custom-domain-notice-card';
import { CustomDomainStatusRefresher } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-status-refresher/custom-domain-status-refresher';
import { DomainVerificationCard } from '@platform/components/features/tenants/domain-page-content/components/domain-verification-card/domain-verification-card';
import { DomainVerificationCardSkeleton } from '@platform/components/features/tenants/domain-page-content/components/domain-verification-card-skeleton/domain-verification-card-skeleton';
import { RemoveCustomDomainControl } from '@platform/components/features/tenants/domain-page-content/components/remove-custom-domain-control/remove-custom-domain-control';
import {
  getProjectDomain,
  type TProjectDomain,
} from '@platform/server/provisioning/vercel-domains-api';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

export type TCustomDomainCardProps = {
  tenant: Pick<TTenant, 'id' | 'plan' | 'deprovisionedAt' | 'primaryDomain'>;
  customDomain: TMaybeUndefined<string>;
  claim: TMaybeUndefined<Pick<TCustomDomainClaim, 'domain' | 'token'>>;
  isPrimaryCustom: boolean;
  primaryProjectDomain: Promise<TProjectDomain>;
  canManage: boolean;
};

export const CustomDomainCard = ({
  tenant,
  customDomain,
  claim,
  isPrimaryCustom,
  primaryProjectDomain,
  canManage,
}: TCustomDomainCardProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { id, plan, deprovisionedAt, primaryDomain } = tenant;
  const isArchived = Boolean(deprovisionedAt);
  const isGrowth = plan === TENANT_PLAN.GROWTH;
  const domain = customDomain ?? (isPrimaryCustom ? primaryDomain : null);
  const shown = domain && {
    domain,
    projectDomain: customDomain
      ? getProjectDomain(customDomain)
      : primaryProjectDomain,
  };
  const canRemove = canManage && !isArchived && Boolean(customDomain);
  const canConnect = !shown && !claim && canManage && !isArchived && isGrowth;
  let noticeKey: 'archivedState' | 'ownerOnly' | 'upgradePrompt' =
    'upgradePrompt';
  if (isGrowth) noticeKey = 'ownerOnly';
  if (isArchived) noticeKey = 'archivedState';

  return (
    <CustomDomainFocusProvider>
      {shown && (
        <Suspense fallback={<DomainVerificationCardSkeleton />}>
          <DomainVerificationCard
            domain={shown.domain}
            isPlatformAddress={false}
            projectDomain={shown.projectDomain}
            title={t('title')}
            actions={
              canRemove && (
                <RemoveCustomDomainControl
                  tenantId={id}
                  domain={shown.domain}
                />
              )
            }
          />
          {customDomain && !isArchived && (
            <CustomDomainStatusRefresher
              tenantId={id}
              initialStatus={shown.projectDomain.then(({ status }) => status)}
            />
          )}
        </Suspense>
      )}
      {!shown && claim && (
        <CustomDomainClaimCard
          tenantId={id}
          domain={claim.domain}
          token={claim.token}
          canManage={canManage && !isArchived}
        />
      )}
      {canConnect && <ConnectCustomDomainForm tenantId={id} />}
      {!shown && !claim && !canConnect && (
        <CustomDomainNoticeCard noticeKey={noticeKey} />
      )}
    </CustomDomainFocusProvider>
  );
};
