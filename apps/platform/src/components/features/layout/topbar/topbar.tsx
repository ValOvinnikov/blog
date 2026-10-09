import type { TAdminRole, TMembershipRole } from '@blog/db/constants';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { Avatar } from '@platform/components/shared/avatar';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { TopbarNavMenu } from './topbar-nav-menu';
import { topbarVariants } from './topbar-variants';

export type TRoleChipProps = {
  name: string | undefined;
  role: TAdminRole | TMembershipRole;
  scope: string;
};

export type TTopbarProps = {
  crumb: ReactNode;
  roleChip: TRoleChipProps;
  sections?: TSidebarNavSection[];
  switcher?: ReactNode;
};

export const Topbar = ({
  crumb,
  roleChip,
  sections,
  switcher,
}: TTopbarProps) => {
  const t = useTranslations('topbar');
  const tRole = useTranslations('roleLabel');
  const { name, role, scope } = roleChip;
  const { root, chip, chipDot, chipText } = topbarVariants();

  return (
    <header className={root()}>
      {sections && <TopbarNavMenu sections={sections} switcher={switcher} />}
      {crumb}
      <span className={chip()}>
        <Avatar name={name ?? ''} variant="chip" />
        <span aria-hidden="true" className={chipDot()} />
        <span className={chipText()}>
          {t('roleChip', { role: tRole(role), scope })}
        </span>
      </span>
    </header>
  );
};
