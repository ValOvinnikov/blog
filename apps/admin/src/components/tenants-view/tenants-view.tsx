import { ArchivedTenantsToggle } from '@admin/components/archived-tenants-toggle';
import { TenantsTable } from '@admin/components/tenants-table';
import { Link } from '@admin/i18n/navigation';
import { adminRoutes } from '@admin/utils/routes/routes';
import { Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Heading } from '@blog/ui/atoms';
import { LinkButton } from '@blog/ui/molecules';
import { useTranslations } from 'next-intl';

import { tenantsViewVariants } from './tenants-view-variants';

export type TTenantsViewProps = {
  tenants: TTenant[];
  shouldShowArchived: boolean;
};

/**
 * The Tenants page body: heading, the add-tenant entry point, and the real
 * tenant list. Ships from day one — with one tenant it's still a finished
 * page, not a placeholder.
 */
export const TenantsView = ({
  tenants,
  shouldShowArchived,
}: TTenantsViewProps) => {
  const t = useTranslations('tenantsView');
  const { root, header, description, toolbar } = tenantsViewVariants();

  return (
    <div className={root()}>
      <div className={header()}>
        <div>
          <Heading level={1} size={Size.MD}>
            {t('title')}
          </Heading>
          <p className={description()}>
            {t.rich('description', { code: (chunks) => <code>{chunks}</code> })}
          </p>
        </div>
        <LinkButton as={Link} href={adminRoutes.addTenant()} variant="primary">
          {t('addTenant')}
        </LinkButton>
      </div>
      <div className={toolbar()}>
        <ArchivedTenantsToggle shouldShowArchived={shouldShowArchived} />
      </div>
      <TenantsTable tenants={tenants} />
    </div>
  );
};
