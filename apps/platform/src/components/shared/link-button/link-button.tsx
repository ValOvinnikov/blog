import { ICONS } from '@blog/config';
import {
  buttonVariants,
  type TButtonVariants,
} from '@platform/components/shared/button/button-variants';
import { Icon } from '@platform/components/shared/icon';
import { Link } from '@platform/i18n/navigation';
import type { ReactNode } from 'react';

export type TLinkButtonProps = {
  href: string;
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  focusGround?: TButtonVariants['focusGround'];
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  hasArrow?: boolean;
};

export const LinkButton = ({
  href,
  variant,
  size,
  focusGround,
  children,
  className,
  ariaLabel,
  hasArrow,
}: TLinkButtonProps) => {
  return (
    <Link
      href={href}
      className={buttonVariants({ variant, size, focusGround }).root({
        class: className,
      })}
      aria-label={ariaLabel}
    >
      {children}
      {hasArrow && <Icon name={ICONS.ARROW} />}
    </Link>
  );
};
