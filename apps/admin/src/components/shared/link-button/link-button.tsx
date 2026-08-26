import { Link } from '@admin/i18n/navigation';
import type { ComponentType, ReactNode } from 'react';

import {
  buttonVariants,
  type TButtonVariants,
} from '../button/button-variants';

type TLinkComponentProps = {
  href: string;
  className?: string;
  children?: ReactNode;
};

export type TLinkButtonProps = {
  href: string;
  as?: ComponentType<TLinkComponentProps>;
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  children?: ReactNode;
  className?: string;
};

export const LinkButton = ({
  href,
  as: Component = Link,
  variant,
  size,
  children,
  className,
}: TLinkButtonProps) => {
  return (
    <Component
      href={href}
      className={buttonVariants({ variant, size, class: className })}
    >
      {children}
    </Component>
  );
};
