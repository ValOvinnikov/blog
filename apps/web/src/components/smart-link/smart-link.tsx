import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

type TSmartLinkProps = {
  href: string;
  target?: '_blank';
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel'>;

const isAbsolute = (href: string) => /^https?:\/\//.test(href);

/**
 * SmartLink — picks the right anchor for a given `href`: the app router's
 * `Link` for internal paths (client-side navigation), or a plain `<a>` for
 * absolute URLs (external links), deriving `rel` from `target`. Works both as
 * a direct link and as the `as`/`linkAs` polymorphic target for `@blog/ui`
 * components (`NavLink`, `LinkButton`, `PrimaryNavigation`).
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

  if (isAbsolute(href)) {
    return (
      <a href={href} target={target} rel={rel} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
