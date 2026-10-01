import { BUTTON_AS_CONST, type IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType, ReactNode } from 'react';

import {
  popoverMenuItemVariants,
  type TPopoverMenuItemVariants,
} from './popover-menu-item-variants';

type TPopoverMenuItemOwnProps = TPopoverMenuItemVariants & {
  className?: string;
  icon?: ReactNode;
};

export type TPopoverMenuItemProps<
  C extends ElementType = typeof BUTTON_AS_CONST,
> = TPolymorphicProps<C, TPopoverMenuItemOwnProps> & IWithDataTestId;

/** A single rounded-rectangle row inside a `PopoverMenu.Panel` (`role="menuitem"`). */
export const PopoverMenuItem = <
  C extends ElementType = typeof BUTTON_AS_CONST,
>({
  as,
  icon,
  className,
  variant,
  children,
  dataTestId,
  ...rest
}: TPopoverMenuItemProps<C>) => {
  const Component = as ?? BUTTON_AS_CONST;
  const isButton = Component === 'button';

  return (
    <Component
      role="menuitem"
      type={isButton ? 'button' : undefined}
      data-testid={dataTestId}
      className={popoverMenuItemVariants({ variant, class: className })}
      {...rest}
    >
      {icon}
      {children}
    </Component>
  );
};
