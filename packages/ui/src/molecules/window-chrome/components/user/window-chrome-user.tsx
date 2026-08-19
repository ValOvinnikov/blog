import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { windowChromeUserVariants } from './window-chrome-user-variants';

export type TWindowChromeUserProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * WindowChromeUser — the accent-coloured "who" segment of a `WindowChrome.Bar`
 * prompt (e.g. the `guest`/`val` in `guest@ovinnikov:~$`, or a highlighted
 * path segment like a post's filename).
 */
export const WindowChromeUser = ({
  className,
  dataTestId,
  children,
}: TWindowChromeUserProps) => (
  <span
    className={windowChromeUserVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);
