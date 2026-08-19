import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode, Ref } from 'react';

import { popoverMenuPanelVariants } from './popover-menu-panel-variants';

export type TPopoverMenuPanelProps = IWithClassName &
  IWithDataTestId & {
    /** `id` referenced by the triggering `PopoverMenu.Trigger`'s `aria-controls`. */
    id: string;
    /** Whether the panel is visible — fully controlled by the caller. */
    isOpen: boolean;
    ariaLabel?: string;
    children?: ReactNode;
    /** Forwarded to the underlying panel `<div>` so the caller can manage focus-trap/outside-click detection against the real node. */
    ref?: Ref<HTMLDivElement>;
  };

/**
 * PopoverMenuPanel — the non-modal menu surface (`role="menu"`) a
 * `PopoverMenu.Trigger` opens. Presentational only: visibility, focus-trap,
 * and Escape/outside-click dismissal are the caller's responsibility —
 * `@blog/ui` only reads the `isOpen` prop.
 */
export const PopoverMenuPanel = ({
  id,
  isOpen,
  ariaLabel,
  ref,
  className,
  children,
  dataTestId,
}: TPopoverMenuPanelProps) => (
  <div
    ref={ref}
    id={id}
    role="menu"
    aria-label={ariaLabel}
    hidden={!isOpen}
    data-testid={dataTestId}
    className={popoverMenuPanelVariants({ class: className })}
  >
    {children}
  </div>
);
