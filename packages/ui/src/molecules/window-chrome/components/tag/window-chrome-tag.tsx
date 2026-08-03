import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { windowChromeTagVariants } from './window-chrome-tag-variants';

export interface IWindowChromeTagProps
  extends ComponentPropsWithoutRef<'span'>, IWithDataTestId {}

/**
 * WindowChromeTag — the trailing uppercase pill on a `WindowChrome.Bar`
 * (e.g. `popover`, `menu`, or a comment count), pushed to the end of the bar
 * regardless of where it appears among the bar's other children.
 */
export const WindowChromeTag = ({
  className,
  dataTestId,
  ...rest
}: IWindowChromeTagProps) => (
  <span
    className={windowChromeTagVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
