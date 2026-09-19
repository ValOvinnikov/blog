import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { toastViewportVariants } from './toast-viewport-variants';

export type TToastViewportProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    children?: ReactNode;
  };

/** The fixed, corner-anchored region that positions and stacks `Toast` children (desktop bottom-right, mobile bottom full-width). */
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
