import type { TMaybeUndefined } from '@blog/config';
import { ExternalLink } from '@platform/components/shared/external-link';
import { textLinkVariants } from '@platform/components/shared/text-link/text-link-variants';
import type { ReactNode } from 'react';

export type TLegalPageLinkProps = {
  href: TMaybeUndefined<string>;
  children: ReactNode;
};

/** Names a legal page, linked only when the apex serves it. */
export const LegalPageLink = ({ href, children }: TLegalPageLinkProps) =>
  href ? (
    <ExternalLink href={href} className={textLinkVariants()}>
      {children}
    </ExternalLink>
  ) : (
    children
  );
