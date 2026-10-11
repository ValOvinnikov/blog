import { ICONS, SIZE } from '@blog/config';
import {
  buttonVariants,
  type TButtonVariants,
} from '@platform/components/shared/button/button-variants';
import { Icon } from '@platform/components/shared/icon';
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
};

export const ExternalLinkButton = ({
  href,
  variant,
  size,
  children,
  className,
  ariaLabel,
  title,
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
      <Icon name={ICONS.EXTERNAL_LINK} size={SIZE.SM} />{' '}
      <span className={newTabHintVariants()}>{t('newTabHint')}</span>
    </a>
  );
};
