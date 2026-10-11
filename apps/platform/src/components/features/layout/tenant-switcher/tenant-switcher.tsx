'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS, SIZE } from '@blog/config';
import { Avatar } from '@platform/components/shared/avatar';
import { Icon } from '@platform/components/shared/icon';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Link } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantSwitcherItem } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import { useTranslations } from 'next-intl';

import { tenantSwitcherVariants } from './tenant-switcher-variants';

export type TTenantSwitcherProps = {
  tenants: TTenantSwitcherItem[];
  activeTenantId: string;
};

export const TenantSwitcher = ({
  tenants,
  activeTenantId,
}: TTenantSwitcherProps) => {
  const active =
    tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0];

  const t = useTranslations('tenantSwitcher');

  const {
    trigger,
    meta,
    nameRow,
    name,
    domain,
    chev,
    badge,
    popup,
    item,
    itemNameRow,
    itemName,
    itemDomain,
    itemBadge,
  } = tenantSwitcherVariants();

  if (!active) {
    return null;
  }

  return (
    <Menu.Root>
      <Menu.Trigger className={trigger()}>
        <Avatar name={active.name} variant="switcher" />
        <span className={meta()}>
          <span className={nameRow()}>
            <span className={name()}>{active.name}</span>
            {active.isArchived && (
              <StatusBadge tone="neutral" hasDot={false} className={badge()}>
                {t('archived')}
              </StatusBadge>
            )}
          </span>
          <span className={domain()}>{active.primaryDomain}</span>
        </span>
        <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} className={chev()} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          {/* Base UI points the popup's aria-labelledby at the trigger unconditionally,
              which wins over any aria-label here per the accname algorithm — and the
              trigger's own text (active tenant + domain) is already the right name. */}
          <Menu.Popup className={popup()}>
            {tenants.map((tenant) => (
              <Menu.LinkItem
                key={tenant.id}
                className={item()}
                render={
                  <Link
                    href={adminRoutes.dashboardSelectTenantHref(tenant.id)}
                    prefetch={false}
                  />
                }
              >
                <span className={itemNameRow()}>
                  <span className={itemName()}>{tenant.name}</span>
                  {tenant.isArchived && (
                    <StatusBadge
                      tone="neutral"
                      hasDot={false}
                      className={itemBadge()}
                    >
                      {t('archived')}
                    </StatusBadge>
                  )}
                </span>
                <span className={itemDomain()}>{tenant.primaryDomain}</span>
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
