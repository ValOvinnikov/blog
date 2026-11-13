import type { TMaybeUndefined } from '@blog/config';
import type { TCustomDomainClaim } from '@blog/db/schema/custom-domain-claims';
import { ConnectCustomDomainForm } from '@platform/components/features/tenants/domain-page-content/components/connect-custom-domain-form/connect-custom-domain-form';
import { CustomDomainActions } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-actions/custom-domain-actions';
import { CustomDomainClaimCard } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-claim-card/custom-domain-claim-card';
import { CustomDomainFocusProvider } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/custom-domain-focus-provider';
import { CustomDomainNoticeCard } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-notice-card/custom-domain-notice-card';
import { CustomDomainStatusRefresher } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-status-refresher/custom-domain-status-refresher';
import { DomainVerificationCard } from '@platform/components/features/tenants/domain-page-content/components/domain-verification-card/domain-verification-card';
import { DomainVerificationCardSkeleton } from '@platform/components/features/tenants/domain-page-content/components/domain-verification-card-skeleton/domain-verification-card-skeleton';
import type { TProjectDomain } from '@platform/server/provisioning/project-domain';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

export type TCustomDomainCardProps = {
  tenant: Pick<
    TPlatformTenant,
    'id' | 'isArchived' | 'entitlements' | 'primaryDomain'
  >;
  customDomain: TMaybeUndefined<string>;
  subdomain: TMaybeUndefined<string>;
  claim: TMaybeUndefined<Pick<TCustomDomainClaim, 'domain' | 'token'>>;
  isPrimaryCustom: boolean;
  primaryProjectDomain: Promise<TProjectDomain>;
  canManage: boolean;
};

export const CustomDomainCard = ({
  tenant,
  customDomain,
  subdomain,
  claim,
  isPrimaryCustom,
  primaryProjectDomain,
  canManage,
}: TCustomDomainCardProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { id, isArchived, entitlements, primaryDomain } = tenant;
  const { hasCustomDomain } = entitlements;
  const domain = customDomain ?? (isPrimaryCustom ? primaryDomain : null);
  const shown = domain && {
    domain,
    projectDomain: customDomain
      ? getProjectDomain(customDomain)
      : primaryProjectDomain,
  };
  const canAct = canManage && !isArchived;
  const canConnect =
    !shown && !claim && canManage && !isArchived && hasCustomDomain;
  let noticeKey: 'archivedState' | 'ownerOnly' | 'upgradePrompt' =
    'upgradePrompt';
  if (hasCustomDomain) noticeKey = 'ownerOnly';
  if (isArchived) noticeKey = 'archivedState';

  return (
    <CustomDomainFocusProvider>
      {shown && (
        <Suspense fallback={<DomainVerificationCardSkeleton />}>
          <DomainVerificationCard
            key={isPrimaryCustom ? 'main' : 'secondary'}
            domain={shown.domain}
            isPlatformAddress={false}
            projectDomain={shown.projectDomain}
            title={isPrimaryCustom ? t('mainTitle') : t('title')}
            note={
              isPrimaryCustom && subdomain
                ? t('subdomainStillWorks', { subdomain })
                : undefined
            }
            actions={
              canAct && (
                <CustomDomainActions
                  tenantId={id}
                  domain={shown.domain}
                  projectDomain={shown.projectDomain}
                  isMainAddress={isPrimaryCustom}
                  canMakeMain={hasCustomDomain}
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
          canManage={canAct}
        />
      )}
      {canConnect && <ConnectCustomDomainForm tenantId={id} />}
      {!shown && !claim && !canConnect && (
        <CustomDomainNoticeCard noticeKey={noticeKey} />
      )}
    </CustomDomainFocusProvider>
  );
};
