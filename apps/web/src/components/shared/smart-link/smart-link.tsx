import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

type TSmartLinkProps = {
  href: string;
  target?: '_blank';
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel'>;

/**
 * SmartLink — the app's link with `rel` derived from `target`. Renders
 * `next/link` (which handles both internal client-side navigation and external
 * URLs), adding `rel="noopener noreferrer"` only when `target="_blank"`. Works
 * both as a direct link and as the `as`/`linkAs` polymorphic target for
 * `@blog/ui` components (`NavLink`, `LinkButton`, `PrimaryNavigation`).
 *
 * @example
 * <LinkButton as={SmartLink} href={action.href} target={action.target}>
 *   {action.label}
 * </LinkButton>
 */
export function SmartLink({
  href,
  target,
  children,
  ...rest
}: TSmartLinkProps) {
  const rel = target === '_blank' ? 'noopener noreferrer' : undefined;

  return (
    <Link href={href} target={target} rel={rel} {...rest}>
      {children}
    </Link>
  );
}
