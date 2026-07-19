import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { terminalTypingVariants } from './terminal-typing-variants';

export interface ITerminalTypingProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>, IWithDataTestId {
  text: string;
  showCursor?: boolean;
}

/**
 * TerminalTyping atom — a monospace, terminal-styled wordmark for a hero-intro
 * flourish. This atom only ever renders the **final typed-out state** (the
 * full `text` plus an optional blinking cursor); `@blog/ui` cannot ship
 * `'use client'`, so it has no knowledge of progressive, character-by-character
 * reveal. A client wrapper in `apps/web` is the intended consumer that drives
 * that animation (revealing `text` incrementally over time and respecting
 * `prefers-reduced-motion`) on top of this static building block.
 */
export const TerminalTyping = ({
  text,
  showCursor = true,
  className,
  dataTestId,
  ...rest
}: ITerminalTypingProps) => {
  const { root, cursor } = terminalTypingVariants();

  return (
    <span
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {text}
      {showCursor && <span className={cursor()} aria-hidden="true" />}
    </span>
  );
};
