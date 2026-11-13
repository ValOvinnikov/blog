import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';
import type { ReactNode, Ref } from 'react';

export type TTenantPageHeaderProps = {
  tenant: Pick<TPlatformTenant, 'name' | 'status' | 'plan' | 'siteUrl'>;
  description?: ReactNode;
  hasPlanBadge?: boolean;
  titleRef?: Ref<HTMLHeadingElement>;
};

export const TenantPageHeader = ({
  tenant,
  description,
  hasPlanBadge = true,
  titleRef,
}: TTenantPageHeaderProps) => {
  const { name, status, plan, siteUrl } = tenant;
  const tTenantsTable = useTranslations('tenantsTable');
  const tPlan = useTranslations('planNames');
  const t = useTranslations('tenantOverviewPage');

  return (
    <PageHeader
      title={name}
      titleRef={titleRef}
      description={description}
      badges={
        <>
          <StatusBadge tone={tenantStatusTone(status)}>
            {tTenantsTable(`status.${status}`)}
          </StatusBadge>
          {hasPlanBadge && (
            <StatusBadge tone={BADGE_TONE.PLAN} hasDot={false}>
              {tPlan(plan)}
            </StatusBadge>
          )}
        </>
      }
      actions={
        <ExternalLinkButton href={siteUrl} focusGround={FOCUS_RING_GROUND.BG}>
          {t('openSiteAction')}
        </ExternalLinkButton>
      }
    />
  );
};
