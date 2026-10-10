import {
  buttonVariants,
  type TButtonVariants,
} from '@platform/components/shared/button/button-variants';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { newTabHintVariants } from './external-link-button-variants';

export type TExternalLinkButtonProps = {
  href: string;
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  title?: string;
  hasArrow?: boolean;
};

export const ExternalLinkButton = ({
  href,
  variant,
  size,
  children,
  className,
  ariaLabel,
  title,
  hasArrow,
}: TExternalLinkButtonProps) => {
  const t = useTranslations('externalLinkButton');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant, size }).root({ class: className })}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
      {hasArrow && (
        <>
          <span aria-hidden="true"> ↗</span>{' '}
          <span className={newTabHintVariants()}>{t('newTabHint')}</span>
        </>
      )}
    </a>
  );
};
