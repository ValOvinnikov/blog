import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { windowChromePromptVariants } from './window-chrome-prompt-variants';

export interface IWindowChromePromptProps
  extends ComponentPropsWithoutRef<'span'>, IWithDataTestId {}

/**
 * WindowChromePrompt — the muted "where" segment of a `WindowChrome.Bar`
 * prompt (e.g. the `@ovinnikov:~$` host/path portion, or a leading `$`/path
 * prefix like `~/post/`).
 */
export const WindowChromePrompt = ({
  className,
  dataTestId,
  ...rest
}: IWindowChromePromptProps) => (
  <span
    className={windowChromePromptVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
