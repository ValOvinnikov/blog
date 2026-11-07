'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS } from '@blog/config';
import { Avatar } from '@platform/components/shared/avatar';
import { Icon } from '@platform/components/shared/icon';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { NestableMenuRoot } from '@platform/components/shared/nestable-menu-root';
import { NestableMenuTrigger } from '@platform/components/shared/nestable-menu-trigger';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { useIsNestedMenu } from '@platform/context/nested-menu-provider';
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
  const isNested = useIsNestedMenu();

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
  const { positioner, popup: surfacePopup } = menuSurfaceVariants();

  if (!active) {
    return null;
  }

  return (
    <NestableMenuRoot>
      <NestableMenuTrigger className={trigger()} title={active.name}>
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
        <Icon name={ICONS.CHEVRON_DOWN} className={chev()} />
      </NestableMenuTrigger>
      <Menu.Portal>
        <Menu.Positioner
          side={isNested ? 'bottom' : undefined}
          sideOffset={isNested ? 6 : 4}
          align="start"
          className={positioner()}
        >
          {/* Base UI points the popup's aria-labelledby at the trigger unconditionally,
              which wins over any aria-label here per the accname algorithm — and the
              trigger's own text (active tenant + domain) is already the right name. */}
          <Menu.Popup className={surfacePopup({ class: popup() })}>
            {tenants.map((tenant) => (
              <Menu.LinkItem
                key={tenant.id}
                closeOnClick={true}
                className={item()}
                render={
                  <Link
                    href={adminRoutes.dashboardSelectTenantHref(tenant.id)}
                    prefetch={false}
                    aria-current={tenant.id === active.id ? 'true' : undefined}
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
    </NestableMenuRoot>
  );
};
