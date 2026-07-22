import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes, Ref } from 'react';

import { popoverMenuPanelVariants } from './popover-menu-panel-variants';

export interface IPopoverMenuPanelProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  /** `id` referenced by the triggering `PopoverMenu.Trigger`'s `aria-controls`. */
  id: string;
  /** Whether the panel is visible — fully controlled by the caller. */
  open: boolean;
  ariaLabel?: string;
  /** Forwarded to the underlying panel `<div>` so the caller can manage focus-trap/outside-click detection against the real node. */
  ref?: Ref<HTMLDivElement>;
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
  ref,
  className,
  children,
  dataTestId,
  ...rest
}: IPopoverMenuPanelProps) => (
  <div
    {...rest}
    ref={ref}
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
