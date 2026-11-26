import { usePinnedTenants } from '@platform/components/features/tenants/pinned-tenants-provider';
import { Avatar } from '@platform/components/shared/avatar';
import { IconSoloButton } from '@platform/components/shared/icon-solo-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { AVATAR_VARIANT } from '@platform/constants/avatar';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { Link } from '@platform/i18n/navigation';
import type { TPinnedTenant } from '@platform/utils/pinned-tenants/pinned-tenants';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { tenantManageHref } from '@platform/utils/tenant-manage-href/tenant-manage-href';
import { ICONS } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { pinnedTenantTileVariants } from './pinned-tenant-tile-variants';

export type TPinnedTenantTileProps = {
  tenant: TPinnedTenant;
  isInert: boolean;
};

export const PinnedTenantTile = ({
  tenant,
  isInert,
}: TPinnedTenantTileProps) => {
  const t = useTranslations('pinnedTenants');
  const tTable = useTranslations('tenantsTable');
  const tPlan = useTranslations('planNames');
  const { setPinned } = usePinnedTenants();
  const { root, link, header, lines, name, domain, badges, unpin } =
    pinnedTenantTileVariants();
  const unpinLabel = t('unpinAriaLabel', { name: tenant.name });

  return (
    <li className={root()} inert={isInert}>
      <Link href={tenantManageHref(tenant)} className={link()}>
        <span className={header()}>
          <Avatar name={tenant.name} variant={AVATAR_VARIANT.TABLE} />
          <span className={lines()}>
            <span className={name()}>{tenant.name}</span>
            <span className={domain()}>{tenant.primaryDomain}</span>
          </span>
        </span>
        <span className={badges()}>
          <StatusBadge tone={BADGE_TONE.PLAN} hasDot={false}>
            {tPlan(tenant.plan)}
          </StatusBadge>
          <StatusBadge tone={tenantStatusTone(tenant.status)}>
            {tTable(`status.${tenant.status}`)}
          </StatusBadge>
        </span>
      </Link>
      <IconSoloButton
        ariaLabel={unpinLabel}
        tooltip={unpinLabel}
        icon={ICONS.PIN}
        onClick={() => setPinned(tenant, false)}
        isTooltipEndAligned={true}
        className={unpin()}
      />
    </li>
  );
};
