import type { ReactNode } from 'react';

import { toastViewportVariants } from './toast-viewport-variants';

export type TToastViewportProps = {
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  dataTestId?: string;
};

/**
 * The fixed, bottom-right region that stacks `Toast` rows. A pure layout
 * shell — the queue, cap, and dismissal logic live in `ToastProvider`.
 */
export const ToastViewport = ({
  ariaLabel,
  children,
  className,
  dataTestId,
}: TToastViewportProps) => (
  <div
    role="region"
    aria-label={ariaLabel}
    className={toastViewportVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
