import { Link } from '@web/i18n/navigation';
import NextLink from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

type TSmartLinkProps = {
  href: string;
  target?: '_blank';
  prefetch?: boolean;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel'>;

// next-intl's scheme check cannot recognise a protocol-relative href as external.
const isProtocolRelative = (href: string) => href.startsWith('//');

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
