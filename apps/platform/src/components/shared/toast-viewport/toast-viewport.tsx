import type { ReactNode } from 'react';

import { toastViewportVariants } from './toast-viewport-variants';

export type TToastViewportProps = {
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  dataTestId?: string;
};

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
