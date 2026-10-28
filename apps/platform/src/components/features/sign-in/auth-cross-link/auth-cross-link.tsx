import { Link } from '@platform/i18n/navigation';
import type { ReactNode } from 'react';

import { authCrossLinkVariants } from './auth-cross-link-variants';

export type TAuthCrossLinkProps = {
  href: string;
  children: ReactNode;
};

export const AuthCrossLink = ({ href, children }: TAuthCrossLinkProps) => (
  <Link href={href} className={authCrossLinkVariants()}>
    {children}
  </Link>
);
