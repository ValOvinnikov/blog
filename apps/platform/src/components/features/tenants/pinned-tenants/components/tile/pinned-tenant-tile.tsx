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
import type { Ref } from 'react';

import { pinnedTenantTileVariants } from './pinned-tenant-tile-variants';

export type TPinnedTenantTileProps = {
  tenant: TPinnedTenant;
  isInert: boolean;
  onUnpin: () => void;
  unpinButtonRef: Ref<HTMLButtonElement>;
};

export const PinnedTenantTile = ({
  tenant,
  isInert,
  onUnpin,
  unpinButtonRef,
}: TPinnedTenantTileProps) => {
  const t = useTranslations('pinnedTenants');
  const tTable = useTranslations('tenantsTable');
  const tPlan = useTranslations('planNames');
  const { name: tenantName, primaryDomain, plan, status } = tenant;
  const { root, link, header, lines, name, domain, badges, unpin } =
    pinnedTenantTileVariants();
  const unpinLabel = t('unpinAriaLabel', { name: tenantName });

  return (
    <li className={root()} inert={isInert}>
      <Link href={tenantManageHref(tenant)} className={link()}>
        <span className={header()}>
          <Avatar name={tenantName} variant={AVATAR_VARIANT.TABLE} />
          <span className={lines()}>
            <span className={name()}>{tenantName}</span>
            <span className={domain()}>{primaryDomain}</span>
          </span>
        </span>
        <span className={badges()}>
          <StatusBadge tone={BADGE_TONE.PLAN} hasDot={false}>
            {tPlan(plan)}
          </StatusBadge>
          <StatusBadge tone={tenantStatusTone(status)}>
            {tTable(`status.${status}`)}
          </StatusBadge>
        </span>
      </Link>
      <IconSoloButton
        ref={unpinButtonRef}
        ariaLabel={unpinLabel}
        tooltip={unpinLabel}
        icon={ICONS.PIN}
        onClick={onUnpin}
        isTooltipEndAligned={true}
        className={unpin()}
      />
    </li>
  );
};
