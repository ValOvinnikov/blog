import { ICONS } from '@blog/config';
import {
  buttonVariants,
  type TButtonVariants,
} from '@platform/components/shared/button/button-variants';
import { ExternalLink } from '@platform/components/shared/external-link';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import type { ReactNode } from 'react';

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
  return (
    <ExternalLink
      href={href}
      className={buttonVariants({ variant, size }).root({ class: className })}
      ariaLabel={ariaLabel}
      title={title}
    >
      {children}
      <Icon name={ICONS.EXTERNAL_LINK} size={ICON_SIZE.MD} />
    </ExternalLink>
  );
};
