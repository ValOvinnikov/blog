import type { IWithDataTestId } from '@blog/config';
import { headingTags, type THeadingLevel } from '@blog/ui/lib/react';
import type { ComponentPropsWithoutRef } from 'react';

import { windowChromeBarVariants } from './window-chrome-bar-variants';

export interface IWindowChromeBarProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {
  headingLevel?: THeadingLevel;
}

/**
 * WindowChromeBar — the `WindowChrome` title bar. A prompt-styled flex row
 * that hosts whatever mix of `WindowChrome.User`/`WindowChrome.Prompt`
 * segments, plain command text, and a trailing `WindowChrome.Tag` pill the
 * caller composes, in the order each feature's prompt reads. Renders as a
 * plain `div` unless `headingLevel` opts it into a real `h1`–`h4` tag — the
 * exact same classes either way — for callers whose bar is a section's only
 * heading in the page outline.
 */
export const WindowChromeBar = ({
  className,
  dataTestId,
  headingLevel,
  ...rest
}: IWindowChromeBarProps) => {
  const Tag = headingLevel ? headingTags[headingLevel] : 'div';
  return (
    <Tag
      className={windowChromeBarVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
