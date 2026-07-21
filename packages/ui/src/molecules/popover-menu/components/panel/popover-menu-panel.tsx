import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { popoverMenuPanelVariants } from './popover-menu-panel-variants';

export interface IPopoverMenuPanelProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  /** `id` referenced by the triggering `PopoverMenu.Trigger`'s `aria-controls`. */
  id: string;
  /** Whether the panel is visible — fully controlled by the caller. */
  open: boolean;
  ariaLabel?: string;
}

/**
 * PopoverMenuPanel — the non-modal menu surface (`role="menu"`) a
 * `PopoverMenu.Trigger` opens. Presentational only: visibility, focus-trap,
 * and Escape/outside-click dismissal are the caller's responsibility —
 * `@blog/ui` only reads the `open` prop.
 */
export const PopoverMenuPanel = ({
  id,
  open,
  ariaLabel,
  className,
  children,
  dataTestId,
  ...rest
}: IPopoverMenuPanelProps) => (
  <div
    {...rest}
    id={id}
    role="menu"
    aria-label={ariaLabel}
    hidden={!open}
    data-testid={dataTestId}
    className={popoverMenuPanelVariants({ class: className })}
  >
    {children}
  </div>
);
