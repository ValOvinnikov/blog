import { usePinnedTenants } from '@platform/components/features/tenants/pinned-tenants-provider';
import { IconSoloToggle } from '@platform/components/shared/icon-solo-toggle';
import {
  toPinnedTenant,
  type TPinnedTenant,
} from '@platform/utils/pinned-tenants/pinned-tenants';
import { ICONS } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { pinTenantToggleVariants } from './pin-tenant-toggle-variants';

export type TPinTenantToggleProps = {
  tenant: TPinnedTenant;
};

export const PinTenantToggle = ({ tenant }: TPinTenantToggleProps) => {
  const t = useTranslations('pinnedTenants');
  const { pinnedTenants, setPinned } = usePinnedTenants();
  const isPinned = pinnedTenants.some(({ id }) => id === tenant.id);
  const label = t(isPinned ? 'unpinAriaLabel' : 'pinAriaLabel', {
    name: tenant.name,
  });

  return (
    <IconSoloToggle
      ariaLabel={label}
      tooltip={label}
      icon={ICONS.PIN}
      isPressed={isPinned}
      onPressedChange={(shouldPin) =>
        setPinned(toPinnedTenant(tenant), shouldPin)
      }
      className={pinTenantToggleVariants()}
    />
  );
};
