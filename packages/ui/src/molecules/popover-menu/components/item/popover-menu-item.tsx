import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType, ReactNode } from 'react';

import { popoverMenuItemVariants } from './popover-menu-item-variants';

type TPopoverMenuItemOwnProps = {
  className?: string;
  icon?: ReactNode;
};

export type TPopoverMenuItemProps<C extends ElementType = 'button'> =
  TPolymorphicProps<C, TPopoverMenuItemOwnProps> & IWithDataTestId;

/**
 * PopoverMenuItem — a single pill-styled row inside a `PopoverMenu.Panel`
 * (`role="menuitem"`). Renders as a `<button>` by default (e.g. "Copy link");
 * pass `as` for a link-style item (e.g. `as="a"` or a router `Link` for
 * "Share on X"/"Share on LinkedIn").
 */
export const PopoverMenuItem = <C extends ElementType = 'button'>({
  as,
  icon,
  className,
  children,
  dataTestId,
  ...rest
}: TPopoverMenuItemProps<C>) => {
  const Component = (as ?? 'button') as ElementType;
  const isButton = Component === 'button';

  return (
    <Component
      role="menuitem"
      type={isButton ? 'button' : undefined}
      data-testid={dataTestId}
      className={popoverMenuItemVariants({ class: className })}
      {...rest}
    >
      {icon}
      {children}
    </Component>
  );
};
