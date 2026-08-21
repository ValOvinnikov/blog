import { Link } from '@web/i18n/navigation';
import NextLink from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

type TSmartLinkProps = {
  href: string;
  target?: '_blank';
  /** Forwarded to `next/link`'s own prop of the same name — set `false` for a link that isn't a real page navigation (e.g. a file-download route) so hovering it never triggers a wasted background prefetch fetch. */
  prefetch?: boolean;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel'>;

const isProtocolRelative = (href: string) => href.startsWith('//');

/**
 * SmartLink — the app's one link component: locale-aware (renders next-intl's
 * `Link`, which prefixes internal pathnames and passes `http(s):`/`mailto:`/
 * `tel:` absolute URLs through untouched) with `rel` derived from `target`
 * (`rel="noopener noreferrer"` only when `target="_blank"`). Protocol-relative
 * hrefs (`//host/path`) are the one case next-intl's scheme check can't
 * classify as external, so those render through plain `next/link` instead.
 * Works both as a direct link and as the `as`/`linkAs` polymorphic target for
 * `@blog/ui` components (`NavLink`, `LinkButton`, `PrimaryNavigation`).
 *
 * @example
 * <LinkButton as={SmartLink} href={action.href} target={action.target}>
 *   {action.label}
 * </LinkButton>
 */
export const SmartLink = ({
  href,
  target,
  prefetch,
  children,
  ...rest
}: TSmartLinkProps) => {
  const rel = target === '_blank' ? 'noopener noreferrer' : undefined;

  if (isProtocolRelative(href)) {
    return (
      <NextLink href={href} target={target} rel={rel} {...rest}>
        {children}
      </NextLink>
    );
  }

  return (
    <Link href={href} target={target} rel={rel} prefetch={prefetch} {...rest}>
      {children}
    </Link>
  );
};
