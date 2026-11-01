import type { TTenant } from '@blog/db/schema/tenants';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { tenantSiteUrl } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TTenantPageHeaderProps = {
  tenant: Pick<TTenant, 'name' | 'status' | 'plan' | 'primaryDomain'>;
  description?: ReactNode;
};

export const TenantPageHeader = ({
  tenant,
  description,
}: TTenantPageHeaderProps) => {
  const { name, status, plan, primaryDomain } = tenant;
  const tTenantsTable = useTranslations('tenantsTable');
  const t = useTranslations('tenantOverviewPage');

  return (
    <PageHeader
      title={name}
      description={description}
      badges={
        <>
          <StatusBadge tone={tenantStatusTone(status)}>
            {tTenantsTable(`status.${status}`)}
          </StatusBadge>
          <StatusBadge tone="plan" hasDot={false}>
            {tTenantsTable(`plan.${plan}`)}
          </StatusBadge>
        </>
      }
      actions={
        <ExternalLinkButton
          href={tenantSiteUrl(primaryDomain)}
          focusGround={FOCUS_RING_GROUND.BG}
        >
          {t('openSiteAction')}
        </ExternalLinkButton>
      }
    />
  );
};
