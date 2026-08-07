import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { windowChromeBarVariants } from './window-chrome-bar-variants';

export interface IWindowChromeBarProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {
  headingLevel?: 1 | 2 | 3 | 4;
}

const headingTags: Record<1 | 2 | 3 | 4, 'h1' | 'h2' | 'h3' | 'h4'> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
};

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
