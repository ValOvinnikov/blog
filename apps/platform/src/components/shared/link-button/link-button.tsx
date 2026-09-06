import { Link } from '@platform/i18n/navigation';
import type { ComponentType, ReactNode } from 'react';

import {
  buttonVariants,
  type TButtonVariants,
} from '../button/button-variants';

type TLinkComponentProps = {
  href: string;
  className?: string;
  children?: ReactNode;
  'aria-label'?: string;
};

export type TLinkButtonProps = {
  href: string;
  as?: ComponentType<TLinkComponentProps>;
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Appends a decorative arrow, hidden from the accessible name. */
  hasArrow?: boolean;
};

export const LinkButton = ({
  href,
  as: Component = Link,
  variant,
  size,
  children,
  className,
  ariaLabel,
  hasArrow,
}: TLinkButtonProps) => {
  return (
    <Component
      href={href}
      className={buttonVariants({ variant, size }).root({ class: className })}
      aria-label={ariaLabel}
    >
      {children}
      {hasArrow && <span aria-hidden="true"> →</span>}
    </Component>
  );
};
