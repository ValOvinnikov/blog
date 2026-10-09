import { ICONS } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { ArchivedTenantsToggle } from '@platform/components/features/tenants/archived-tenants-toggle';
import { EmailAlertsBanner } from '@platform/components/features/tenants/email-alerts-banner';
import { TenantsTable } from '@platform/components/features/tenants/tenants-table';
import { Icon } from '@platform/components/shared/icon';
import { LinkButton } from '@platform/components/shared/link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { tenantsViewVariants } from './tenants-view-variants';

export type TTenantsViewProps = {
  tenants: TTenant[];
  shouldShowArchived: boolean;
  isEmailAlertingConfigured: boolean;
};

export const TenantsView = ({
  tenants,
  shouldShowArchived,
  isEmailAlertingConfigured,
}: TTenantsViewProps) => {
  const t = useTranslations('tenantsView');
  const { root, toolbar, codeChunk } = tenantsViewVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={t('title')}
        description={t.rich('description', {
          code: (chunks) => <code className={codeChunk()}>{chunks}</code>,
        })}
        actions={
          <LinkButton href={adminRoutes.newTenant()} variant="primary">
            <Icon name={ICONS.PLUS} />
            {t('addTenant')}
          </LinkButton>
        }
      />
      {!isEmailAlertingConfigured && <EmailAlertsBanner />}
      <div className={toolbar()}>
        <ArchivedTenantsToggle shouldShowArchived={shouldShowArchived} />
      </div>
      <TenantsTable tenants={tenants} />
    </div>
  );
};
