'use client';

import { adminRoutes } from '@admin/utils/routes/routes';
import { Menu } from '@base-ui/react/menu';
import { ICONS, Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Avatar, Icon } from '@blog/ui/atoms';
import Link from 'next/link';

import { tenantSwitcherVariants } from './tenant-switcher-variants';

export type TTenantSwitcherProps = {
  /** Every tenant the signed-in user can switch into. */
  tenants: TTenant[];
  activeTenantId: string;
  /**
   * Builds each list item's link target. Defaults to the slug-routed
   * `/t/{slug}` the sidebar's own switcher uses; the slug-free `/dashboard`
   * tree passes its own tenant-select endpoint instead, reusing this same
   * list-rendering rather than a second tenant picker.
   */
  hrefFor?: (tenant: TTenant) => string;
};

/**
 * The tenant picker in the sidebar. Behaviour (open state, focus, dismissal)
 * comes entirely from Base UI's `Menu` — nothing hand-rolled here. Renders
 * correctly with a single tenant today; adding more is a matter of the
 * caller passing a longer `tenants` list, not a change to this component.
 */
export function TenantSwitcher({
  tenants,
  activeTenantId,
  hrefFor = (tenant) => adminRoutes.tenant(tenant.slug),
}: TTenantSwitcherProps) {
  const active =
    tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0];

  const {
    trigger,
    meta,
    name,
    domain,
    chevron,
    popup,
    item,
    itemName,
    itemDomain,
  } = tenantSwitcherVariants();

  if (!active) {
    return null;
  }

  return (
    <Menu.Root>
      <Menu.Trigger className={trigger()}>
        <span aria-hidden="true">
          <Avatar name={active.name} alt={active.name} size={Size.SM} />
        </span>
        <span className={meta()}>
          <span className={name()}>{active.name}</span>
          <span className={domain()}>{active.primaryDomain}</span>
        </span>
        <Icon name={ICONS.CHEVRON_RIGHT} size={Size.SM} className={chevron()} />
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
                <span className={itemName()}>{tenant.name}</span>
                <span className={itemDomain()}>{tenant.primaryDomain}</span>
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
