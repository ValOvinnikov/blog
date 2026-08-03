import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { windowChromeBodyVariants } from './window-chrome-body-variants';

export interface IWindowChromeBodyProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {}

/**
 * WindowChromeBody — the padded content slot below a `WindowChrome.Bar`.
 * Generic positioning container; the caller supplies whatever
 * feature-specific content (a sign-in provider list, a rating gauge, a
 * comment thread) belongs inside the window.
 */
export const WindowChromeBody = ({
  className,
  dataTestId,
  ...rest
}: IWindowChromeBodyProps) => (
  <div
    className={windowChromeBodyVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
