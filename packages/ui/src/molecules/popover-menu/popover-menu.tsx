import type { IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  Fragment,
} from 'react';

import { PopoverMenuItem } from './components/item/popover-menu-item';
import { PopoverMenuPanel } from './components/panel/popover-menu-panel';
import { PopoverMenuSeparator } from './components/separator/popover-menu-separator';
import { PopoverMenuTrigger } from './components/trigger/popover-menu-trigger';
import { popoverMenuVariants } from './popover-menu-variants';

const PopoverMenuSlotParts = {
  Trigger: PopoverMenuTrigger,
  Panel: PopoverMenuPanel,
} satisfies Record<string, ElementType>;

const PopoverMenuParts = {
  ...PopoverMenuSlotParts,
  Item: PopoverMenuItem,
  Separator: PopoverMenuSeparator,
} satisfies Record<string, ElementType>;

export interface IPopoverMenuProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  children?: TCompoundChildren<typeof PopoverMenuSlotParts>;
}

/**
 * PopoverMenu — positioned trigger + non-modal menu panel primitive
 * (`PopoverMenu.Trigger`, `PopoverMenu.Panel`, `PopoverMenu.Item`,
 * `PopoverMenu.Separator`). Pure
 * structure/ARIA/styling: open/closed state, focus trap, and Escape/
 * outside-click dismissal are the caller's responsibility, since `@blog/ui`
 * never carries client-side state or a `"use client"` directive. `apps/web`
 * composes a client wrapper around this that owns that behaviour.
 */
const PopoverMenuRoot = ({
  children,
  className,
  dataTestId,
  ...rest
}: IPopoverMenuProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PopoverMenuSlotParts);

  return (
    <div
      className={popoverMenuVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Trigger}
      {slots.Panel}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
};

export const PopoverMenu: TCompoundComponent<
  typeof PopoverMenuRoot,
  typeof PopoverMenuParts
> = Object.assign(PopoverMenuRoot, PopoverMenuParts);
