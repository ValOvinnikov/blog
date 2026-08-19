import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { windowChromePromptVariants } from './window-chrome-prompt-variants';

export type TWindowChromePromptProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * WindowChromePrompt — the muted "where" segment of a `WindowChrome.Bar`
 * prompt (e.g. the `@ovinnikov:~$` host/path portion, or a leading `$`/path
 * prefix like `~/post/`).
 */
export const WindowChromePrompt = ({
  className,
  dataTestId,
  children,
}: TWindowChromePromptProps) => (
  <span
    className={windowChromePromptVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);
