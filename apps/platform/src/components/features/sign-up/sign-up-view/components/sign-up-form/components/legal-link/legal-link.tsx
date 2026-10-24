import type { TMaybeUndefined } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { ReactNode } from 'react';

const legalLinkVariants = tv({
  base: [
    'font-medium text-admin-brand underline underline-offset-2',
    'rounded-[2px] outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand',
  ],
});

export type TLegalLinkProps = {
  href: TMaybeUndefined<string>;
  children: ReactNode;
};

export const LegalLink = ({ href, children }: TLegalLinkProps) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={legalLinkVariants()}
    >
      {children}
    </a>
  ) : (
    children
  );
