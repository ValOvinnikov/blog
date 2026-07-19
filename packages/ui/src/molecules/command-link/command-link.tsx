import type { IWithDataTestId } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType } from 'react';

import { commandLinkVariants } from './command-link-variants';

type TCommandLinkOwnProps = {
  prompt?: string;
  command: string;
  ariaLabel: string;
  showArrow?: boolean;
  showCursor?: boolean;
  className?: string;
} & IWithDataTestId;

export type TCommandLinkProps<C extends ElementType = 'a'> = TPolymorphicProps<
  C,
  TCommandLinkOwnProps
>;

/**
 * CommandLink molecule — a monospace, terminal-prompt-styled navigation link
 * (`$ cd ~ →`). Shares the terminal aesthetic (and the CSS-only `blink`
 * cursor) with `TerminalChip`, but is interactive and polymorphic. The
 * prompt, arrow, and cursor are decorative (`aria-hidden`); `ariaLabel`
 * supplies the real accessible name because the visible command reads as
 * jargon aloud.
 */
export const CommandLink = <C extends ElementType = 'a'>({
  as,
  prompt = '$',
  command,
  ariaLabel,
  showArrow = true,
  showCursor = false,
  className,
  dataTestId,
  ...rest
}: TCommandLinkProps<C>) => {
  const Component = (as ?? 'a') as ElementType;
  const {
    root,
    prompt: promptSlot,
    command: commandSlot,
    arrow,
    cursor,
  } = commandLinkVariants();

  return (
    <Component
      className={root({ class: className })}
      {...rest}
      aria-label={ariaLabel}
      data-testid={dataTestId}
    >
      <span className={promptSlot()} aria-hidden="true">
        {prompt}
      </span>
      <span className={commandSlot()}>{command}</span>
      {showArrow && (
        <span className={arrow()} aria-hidden="true">
          →
        </span>
      )}
      {showCursor && (
        <span className={cursor()} aria-hidden="true" data-testid="cursor" />
      )}
    </Component>
  );
};
