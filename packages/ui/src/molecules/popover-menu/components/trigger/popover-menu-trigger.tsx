import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { IconButton } from '@blog/ui/atoms/icon-button';
import type { TIconButtonVariants } from '@blog/ui/atoms/icon-button/icon-button-variants';
import type { MouseEventHandler, ReactNode, Ref } from 'react';

export type TPopoverMenuTriggerProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    /** Whether the panel this trigger controls is currently open — drives `aria-expanded`. The caller (`apps/web`) owns the open/closed state. */
    isOpen: boolean;
    /** `id` of the `PopoverMenu.Panel` this trigger controls — wired to `aria-controls`. */
    panelId: string;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    /** Forwarded to the underlying `IconButton`'s own `variant` axis. */
    variant?: TIconButtonVariants['variant'];
    /** Forwarded to the underlying `<button>` so the caller can manage focus (e.g. return focus here when the panel closes). */
    ref?: Ref<HTMLButtonElement>;
  };

/**
 * PopoverMenuTrigger — icon-button that opens/closes a `PopoverMenu.Panel`.
 * Presentational only: `isOpen` and the click handler are fully controlled by
 * the caller, which also owns any focus-trap/outside-click behaviour.
 */
export const PopoverMenuTrigger = ({
  ariaLabel,
  isOpen,
  panelId,
  ref,
  className,
  variant,
  dataTestId,
  children,
  onClick,
}: TPopoverMenuTriggerProps) => (
  <IconButton
    ref={ref}
    ariaLabel={ariaLabel}
    title={ariaLabel}
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-controls={panelId}
    variant={variant}
    className={className}
    dataTestId={dataTestId}
    onClick={onClick}
  >
    {children}
  </IconButton>
);
