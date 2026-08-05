import type { IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { toastViewportVariants } from './toast-viewport-variants';

export interface IToastViewportProps extends IWithDataTestId {
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
}

/**
 * ToastViewport — the fixed, corner-anchored region that positions and
 * stacks `Toast` children (desktop bottom-right, mobile bottom full-width).
 * A pure layout shell: it owns no queue, timers, or dismissal logic — the
 * caller controls stacking order, the visible cap, and which toasts are
 * currently mounted.
 */
export const ToastViewport = ({
  ariaLabel,
  children,
  className,
  dataTestId,
}: IToastViewportProps) => (
  <div
    role="region"
    aria-label={ariaLabel}
    className={toastViewportVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
