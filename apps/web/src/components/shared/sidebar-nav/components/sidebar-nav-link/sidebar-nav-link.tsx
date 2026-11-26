import type {
  TSidebarNavAriaCurrent,
  TSidebarNavLink,
} from '@web/components/shared/sidebar-nav/types';
import { SmartLink } from '@web/components/shared/smart-link';

interface ISidebarNavLinkProps {
  link: TSidebarNavLink;
  isActive: boolean;
  ariaCurrent: TSidebarNavAriaCurrent;
  className: string;
  onNavigate?: () => void;
}

export const SidebarNavLink = ({
  link: { href, label },
  isActive,
  ariaCurrent,
  className,
  onNavigate,
}: ISidebarNavLinkProps) => (
  <SmartLink
    href={href}
    className={className}
    aria-current={isActive ? ariaCurrent : undefined}
    onClick={onNavigate}
  >
    {label}
  </SmartLink>
);
