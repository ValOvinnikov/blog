import { ICONS } from '@blog/config';
import { ArchivedTenantsToggle } from '@platform/components/features/tenants/archived-tenants-toggle';
import { EmailAlertsBanner } from '@platform/components/features/tenants/email-alerts-banner';
import { TenantsSearch } from '@platform/components/features/tenants/tenants-search';
import { TenantsTable } from '@platform/components/features/tenants/tenants-table';
import { Icon } from '@platform/components/shared/icon';
import { LinkButton } from '@platform/components/shared/link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { ICON_SIZE } from '@platform/constants/icon';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTranslations } from 'next-intl';

import { tenantsViewVariants } from './tenants-view-variants';

export type TTenantsViewProps = {
  tenants: TClientTenant[];
  listQuery: TTenantsListQuery;
  isEmailAlertingConfigured: boolean;
};

export const TenantsView = ({
  tenants,
  listQuery,
  isEmailAlertingConfigured,
}: TTenantsViewProps) => {
  const t = useTranslations('tenantsView');
  const { root } = tenantsViewVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <LinkButton
            href={adminRoutes.newTenant()}
            variant={BUTTON_VARIANT.PRIMARY}
            focusGround={FOCUS_RING_GROUND.BG}
          >
            <Icon name={ICONS.PLUS} size={ICON_SIZE.XL} />
            {t('addTenant')}
          </LinkButton>
        }
      />
      {!isEmailAlertingConfigured && <EmailAlertsBanner />}
      <TenantsTable
        tenants={tenants}
        listQuery={listQuery}
        toolbar={
          <>
            <TenantsSearch listQuery={listQuery} />
            <ArchivedTenantsToggle listQuery={listQuery} />
          </>
        }
      />
    </div>
  );
};
