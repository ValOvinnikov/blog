import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { windowChromeTagVariants } from './window-chrome-tag-variants';

export type TWindowChromeTagProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * WindowChromeTag — the trailing uppercase pill on a `WindowChrome.Bar`
 * (e.g. `popover`, `menu`, or a comment count), pushed to the end of the bar
 * regardless of where it appears among the bar's other children.
 */
export const WindowChromeTag = ({
  className,
  dataTestId,
  children,
}: TWindowChromeTagProps) => (
  <span
    className={windowChromeTagVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);
