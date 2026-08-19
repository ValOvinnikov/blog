import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { windowChromeBodyVariants } from './window-chrome-body-variants';

export type TWindowChromeBodyProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * WindowChromeBody — the padded content slot below a `WindowChrome.Bar`.
 * Generic positioning container; the caller supplies whatever
 * feature-specific content (a sign-in provider list, a rating gauge, a
 * comment thread) belongs inside the window.
 */
export const WindowChromeBody = ({
  className,
  dataTestId,
  children,
}: TWindowChromeBodyProps) => (
  <div
    className={windowChromeBodyVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
