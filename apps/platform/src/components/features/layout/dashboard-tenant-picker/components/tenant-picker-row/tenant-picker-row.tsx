import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { Link } from '@platform/i18n/navigation';
import type { TTenantPickerItem } from '@platform/server/tenants/to-tenant-picker-items';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { tenantPickerRowVariants } from './tenant-picker-row-variants';

export type TTenantPickerRowProps = {
  tenant: TTenantPickerItem;
};

export const TenantPickerRow = ({ tenant }: TTenantPickerRowProps) => {
  const t = useTranslations('dashboardTenantPicker');
  const tRole = useTranslations('roleLabel');
  const tTenants = useTranslations('tenantsTable');
  const { id, name, primaryDomain, isArchived, role, plan } = tenant;
  const {
    row,
    tile,
    text,
    name: nameSlot,
    domain,
    meta,
    separator,
    chevron,
    chevronSpace,
  } = tenantPickerRowVariants({ isArchived });

  return (
    <Link
      href={adminRoutes.dashboardSelectTenantHref(id)}
      prefetch={false}
      className={row()}
    >
      <span aria-hidden={true} className={tile()}>
        {Array.from(name)[0]?.toLocaleUpperCase()}
      </span>
      <span className={text()}>
        <span className={nameSlot()}>{name}</span>
        <span className={domain()}>{primaryDomain}</span>
      </span>
      {isArchived ? (
        <>
          <span className={meta()}>{t('readOnly')}</span>
          <span aria-hidden={true} className={chevronSpace()} />
        </>
      ) : (
        <>
          <span className={meta()}>
            {role && (
              <>
                <span>{tRole(role)}</span>
                <span aria-hidden={true} className={separator()}>
                  ·
                </span>
              </>
            )}
            <span>{tTenants(`plan.${plan}`)}</span>
          </span>
          <Icon name={ICONS.CHEVRON_RIGHT} className={chevron()} />
        </>
      )}
    </Link>
  );
};
