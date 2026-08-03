import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { windowChromeUserVariants } from './window-chrome-user-variants';

export interface IWindowChromeUserProps
  extends ComponentPropsWithoutRef<'span'>, IWithDataTestId {}

/**
 * WindowChromeUser — the accent-coloured "who" segment of a `WindowChrome.Bar`
 * prompt (e.g. the `guest`/`val` in `guest@ovinnikov:~$`, or a highlighted
 * path segment like a post's filename).
 */
export const WindowChromeUser = ({
  className,
  dataTestId,
  ...rest
}: IWindowChromeUserProps) => (
  <span
    className={windowChromeUserVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
