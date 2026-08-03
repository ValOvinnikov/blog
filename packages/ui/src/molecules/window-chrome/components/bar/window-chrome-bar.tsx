import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { windowChromeBarVariants } from './window-chrome-bar-variants';

export interface IWindowChromeBarProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {}

/**
 * WindowChromeBar — the `WindowChrome` title bar. A prompt-styled flex row
 * that hosts whatever mix of `WindowChrome.User`/`WindowChrome.Prompt`
 * segments, plain command text, and a trailing `WindowChrome.Tag` pill the
 * caller composes, in the order each feature's prompt reads.
 */
export const WindowChromeBar = ({
  className,
  dataTestId,
  ...rest
}: IWindowChromeBarProps) => (
  <div
    className={windowChromeBarVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
