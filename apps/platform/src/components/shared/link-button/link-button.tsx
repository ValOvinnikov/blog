import {
  buttonVariants,
  type TButtonVariants,
} from '@platform/components/shared/button/button-variants';
import { Link } from '@platform/i18n/navigation';
import type { ReactNode } from 'react';

export type TLinkButtonProps = {
  href: string;
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  hasArrow?: boolean;
};

export const LinkButton = ({
  href,
  variant,
  size,
  children,
  className,
  ariaLabel,
  hasArrow,
}: TLinkButtonProps) => {
  return (
    <Link
      href={href}
      className={buttonVariants({ variant, size }).root({ class: className })}
      aria-label={ariaLabel}
    >
      {children}
      {hasArrow && <span aria-hidden="true"> →</span>}
    </Link>
  );
};
