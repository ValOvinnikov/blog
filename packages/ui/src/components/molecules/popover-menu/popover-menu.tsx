import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

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

export type TPopoverMenuProps = IWithClassName &
  IWithDataTestId & {
    children?: TCompoundChildren<typeof PopoverMenuSlotParts>;
  };

/** Positioned trigger + non-modal menu panel primitive (`PopoverMenu.Trigger`, `PopoverMenu.Panel`, `PopoverMenu.Item`, `PopoverMenu.Separator`). */
const PopoverMenuRoot = ({
  children,
  className,
  dataTestId,
}: TPopoverMenuProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PopoverMenuSlotParts);

  return (
    <div
      className={popoverMenuVariants({ class: className })}
      data-testid={dataTestId}
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
