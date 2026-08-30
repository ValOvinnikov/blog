import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';
import type { ElementType, ReactNode } from 'react';

import {
  popoverMenuItemVariants,
  type TPopoverMenuItemVariants,
} from './popover-menu-item-variants';

type TPopoverMenuItemOwnProps = TPopoverMenuItemVariants & {
  className?: string;
  icon?: ReactNode;
};

export type TPopoverMenuItemProps<C extends ElementType = 'button'> =
  TPolymorphicProps<C, TPopoverMenuItemOwnProps> & IWithDataTestId;

/**
 * PopoverMenuItem — a single rounded-rectangle row inside a `PopoverMenu.Panel`
 * (`role="menuitem"`). Renders as a `<button>` by default (e.g. "Copy link");
 * pass `as` for a link-style item (e.g. `as="a"` or a router `Link` for
 * "Share on X"/"Share on LinkedIn").
 */
export const PopoverMenuItem = <C extends ElementType = 'button'>({
  as,
  icon,
  className,
  variant,
  children,
  dataTestId,
  ...rest
}: TPopoverMenuItemProps<C>) => {
  const Component = resolveComponent(as, 'button');
  const isButton = Component === 'button';

  return (
    // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `as`/fallback verbatim, so the reference stays stable across renders
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
