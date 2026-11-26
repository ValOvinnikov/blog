import { ICONS } from '@shinefold/config';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import type { TSidebarNavBackLink } from '@web/components/shared/sidebar-nav/types';
import { SmartLink } from '@web/components/shared/smart-link';

import { sidebarNavBackLinkVariants } from './sidebar-nav-back-link-variants';

interface ISidebarNavBackLinkProps {
  backLink: TSidebarNavBackLink;
  onNavigate?: () => void;
}

const s = sidebarNavBackLinkVariants();

export const SidebarNavBackLink = ({
  backLink: { href, label, ariaLabel },
  onNavigate,
}: ISidebarNavBackLinkProps) => (
  <SmartLink
    href={href}
    className={s.link()}
    aria-label={ariaLabel}
    onClick={onNavigate}
  >
    <Icon name={ICONS.ARROW} className={s.arrow()} />
    {label}
  </SmartLink>
);
