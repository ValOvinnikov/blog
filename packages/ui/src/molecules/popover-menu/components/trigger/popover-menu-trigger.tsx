import type { IWithDataTestId } from '@blog/config';
import type { ButtonHTMLAttributes, Ref } from 'react';

import { popoverMenuTriggerVariants } from './popover-menu-trigger-variants';

export interface IPopoverMenuTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, IWithDataTestId {
  ariaLabel: string;
  /** Whether the panel this trigger controls is currently open — drives `aria-expanded`. The caller (`apps/web`) owns the open/closed state. */
  open: boolean;
  /** `id` of the `PopoverMenu.Panel` this trigger controls — wired to `aria-controls`. */
  panelId: string;
  /** Forwarded to the underlying `<button>` so the caller can manage focus (e.g. return focus here when the panel closes). */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * PopoverMenuTrigger — icon-button that opens/closes a `PopoverMenu.Panel`.
 * Presentational only: `open` and the click handler are fully controlled by
 * the caller, which also owns any focus-trap/outside-click behaviour.
 */
export const PopoverMenuTrigger = ({
  ariaLabel,
  open,
  panelId,
  ref,
  className,
  children,
  dataTestId,
  ...rest
}: IPopoverMenuTriggerProps) => (
  <button
    {...rest}
    ref={ref}
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-controls={panelId}
    aria-label={ariaLabel}
    title={ariaLabel}
    data-testid={dataTestId}
    className={popoverMenuTriggerVariants({ class: className })}
  >
    {children}
  </button>
);
