'use client';

import {
  IntentPrefetchLink,
  type TIntentPrefetchLinkProps,
} from '@platform/components/features/layout/intent-prefetch-link';
import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import { usePathname } from '@platform/i18n/navigation';
import { isCurrentNavHref } from '@platform/utils/nav-sections/is-current-nav-href';

export type TSidebarNavLinkProps = Omit<
  TIntentPrefetchLinkProps,
  'className' | 'aria-current'
>;

// The client boundary for the active state; `Sidebar` and its inert rows stay Server Components.
export const SidebarNavLink = ({ href, ...props }: TSidebarNavLinkProps) => {
  const pathname = usePathname();
  const isActive = isCurrentNavHref(href, pathname);
  const { row } = sidebarVariants();

  return (
    <IntentPrefetchLink
      {...props}
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={row({ state: isActive ? 'active' : 'resting' })}
    />
  );
};
