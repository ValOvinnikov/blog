import { ICONS } from '@blog/config';
import {
  buttonVariants,
  type TButtonVariants,
} from '@platform/components/shared/button/button-variants';
import { ExternalLink } from '@platform/components/shared/external-link';
import { Icon } from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

export type TExternalLinkButtonProps = {
  href: string;
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  focusGround?: TButtonVariants['focusGround'];
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  title?: string;
};

export const ExternalLinkButton = ({
  href,
  variant,
  size,
  focusGround,
  children,
  className,
  ariaLabel,
  title,
}: TExternalLinkButtonProps) => {
  return (
    <ExternalLink
      href={href}
      className={buttonVariants({ variant, size, focusGround }).root({
        class: className,
      })}
      ariaLabel={ariaLabel}
      title={title}
    >
      {children}
      <Icon name={ICONS.EXTERNAL_LINK} />
    </ExternalLink>
  );
};
