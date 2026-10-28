import { Link } from '@platform/i18n/navigation';
import type { ReactNode } from 'react';

import { textLinkVariants } from './text-link-variants';

export type TTextLinkProps = {
  href: string;
  children: ReactNode;
};

export const TextLink = ({ href, children }: TTextLinkProps) => (
  <Link href={href} className={textLinkVariants()}>
    {children}
  </Link>
);
