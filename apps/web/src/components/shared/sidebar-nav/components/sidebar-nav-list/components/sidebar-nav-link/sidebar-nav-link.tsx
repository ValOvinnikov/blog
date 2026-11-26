import type { TMaybeUndefined } from '@shinefold/config';
import type {
  TSidebarNavAriaCurrent,
  TSidebarNavLink,
} from '@web/components/shared/sidebar-nav/types';
import { SmartLink } from '@web/components/shared/smart-link';

interface ISidebarNavLinkProps {
  link: TSidebarNavLink;
  ariaCurrent: TMaybeUndefined<TSidebarNavAriaCurrent>;
  className: string;
  onNavigate?: () => void;
}

export const SidebarNavLink = ({
  link: { href, label },
  ariaCurrent,
  className,
  onNavigate,
}: ISidebarNavLinkProps) => (
  <SmartLink
    href={href}
    className={className}
    aria-current={ariaCurrent}
    onClick={onNavigate}
  >
    {label}
  </SmartLink>
);
