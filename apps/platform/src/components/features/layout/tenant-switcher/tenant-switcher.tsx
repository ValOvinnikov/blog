'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS, SIZE } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Avatar } from '@platform/components/shared/avatar';
import { Icon } from '@platform/components/shared/icon';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Link } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { tenantSwitcherVariants } from './tenant-switcher-variants';

export type TTenantSwitcherProps = {
  /** Every tenant the signed-in user can switch into. */
  tenants: TTenant[];
  activeTenantId: string;
  /**
   * Builds each list item's link target. Defaults to the id-routed
   * `/tenants/{id}` tenant overview page the sidebar's own switcher uses; the
   * slug-free `/dashboard` tree passes its own tenant-select endpoint
   * instead, reusing this same list-rendering rather than a second tenant
   * picker.
   */
  hrefFor?: (tenant: TTenant) => string;
};

/**
 * The tenant picker in the sidebar. Behaviour (open state, focus, dismissal)
 * comes entirely from Base UI's `Menu` — nothing hand-rolled here. Renders
 * correctly with a single tenant today; adding more is a matter of the
 * caller passing a longer `tenants` list, not a change to this component.
 */
export const TenantSwitcher = ({
  tenants,
  activeTenantId,
  hrefFor = (tenant) => adminRoutes.tenantOverview(tenant.id),
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
            {Boolean(active.deprovisionedAt) && (
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
                render={<Link href={hrefFor(tenant)} />}
              >
                <span className={itemNameRow()}>
                  <span className={itemName()}>{tenant.name}</span>
                  {Boolean(tenant.deprovisionedAt) && (
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
