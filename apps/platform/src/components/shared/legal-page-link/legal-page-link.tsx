import type { TMaybeUndefined } from '@blog/config';
import { ExternalLink } from '@platform/components/shared/external-link';
import type { ReactNode } from 'react';

import { legalPageLinkVariants } from './legal-page-link-variants';

export type TLegalPageLinkProps = {
  href: TMaybeUndefined<string>;
  children: ReactNode;
};

/** Names a legal page, linked only when the apex serves it. */
export const LegalPageLink = ({ href, children }: TLegalPageLinkProps) =>
  href ? (
    <ExternalLink href={href} className={legalPageLinkVariants()}>
      {children}
    </ExternalLink>
  ) : (
    children
  );
