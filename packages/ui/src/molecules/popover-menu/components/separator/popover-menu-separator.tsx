import type { IWithDataTestId } from '@blog/config';

import { popoverMenuSeparatorVariants } from './popover-menu-separator-variants';

export type TPopoverMenuSeparatorProps = {
  className?: string;
} & IWithDataTestId;

/**
 * PopoverMenuSeparator — a thin hairline dividing groups of
 * `PopoverMenu.Item`s inside a `PopoverMenu.Panel` (e.g. a "Copy link"
 * action from a list of social-share links).
 */
export const PopoverMenuSeparator = ({
  className,
  dataTestId,
}: TPopoverMenuSeparatorProps) => (
  <div
    role="separator"
    className={popoverMenuSeparatorVariants({ class: className })}
    data-testid={dataTestId}
  />
);
