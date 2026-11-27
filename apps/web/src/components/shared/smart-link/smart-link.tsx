'use client';

import { isLocaleIsoCode } from '@shinefold/config';
import { useDefaultLocale } from '@web/context/default-locale-provider';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import NextLink from 'next/link';
import { useLocale } from 'next-intl';
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
  const currentLocale = useLocale();
  const defaultLocale = useDefaultLocale();
  const locale = isLocaleIsoCode(currentLocale) ? currentLocale : defaultLocale;
  const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
  const resolvedHref = isProtocolRelative(href)
    ? href
    : toLocalizedPathname({ href, locale, defaultLocale });

  return (
    <NextLink
      href={resolvedHref}
      target={target}
      rel={rel}
      prefetch={prefetch}
      {...rest}
    >
      {children}
    </NextLink>
  );
};
