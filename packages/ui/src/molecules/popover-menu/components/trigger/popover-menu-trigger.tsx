import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { IconButton } from '@blog/ui/atoms/icon-button';
import type { MouseEventHandler, ReactNode, Ref } from 'react';

export type TPopoverMenuTriggerProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    /** Whether the panel this trigger controls is currently open — drives `aria-expanded`. The caller (`apps/web`) owns the open/closed state. */
    open: boolean;
    /** `id` of the `PopoverMenu.Panel` this trigger controls — wired to `aria-controls`. */
    panelId: string;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    /** Forwarded to the underlying `<button>` so the caller can manage focus (e.g. return focus here when the panel closes). */
    ref?: Ref<HTMLButtonElement>;
  };

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
  dataTestId,
  children,
  onClick,
}: TPopoverMenuTriggerProps) => (
  <IconButton
    ref={ref}
    ariaLabel={ariaLabel}
    title={ariaLabel}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-controls={panelId}
    className={className}
    dataTestId={dataTestId}
    onClick={onClick}
  >
    {children}
  </IconButton>
);
