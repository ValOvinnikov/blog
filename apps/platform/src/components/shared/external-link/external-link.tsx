import type { IWithClassName } from '@blog/config/types';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { newTabHintVariants } from './external-link-variants';

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
}: TExternalLinkProps) => {
  const t = useTranslations('externalLink');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      title={title}
    >
      {children} <span className={newTabHintVariants()}>{t('newTabHint')}</span>
    </a>
  );
};
