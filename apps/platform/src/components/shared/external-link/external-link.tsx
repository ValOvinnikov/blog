import { NewTabHint } from '@platform/components/shared/new-tab-hint';
import type { IWithClassName } from '@shinefold/config/types';
import type { ReactNode } from 'react';

export type TExternalLinkProps = IWithClassName & {
  href: string;
  children?: ReactNode;
  ariaLabel?: string;
  title?: string;
};

export const ExternalLink = ({
  href,
  children,
  className,
  ariaLabel,
  title,
}: TExternalLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
    aria-label={ariaLabel}
    title={title}
  >
    {children} <NewTabHint />
  </a>
);
