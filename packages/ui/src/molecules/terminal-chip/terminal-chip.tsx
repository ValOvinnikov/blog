import type { IWithClassName, IWithDataTestId } from '@blog/config';

import { terminalChipVariants } from './terminal-chip-variants';

export type TTerminalChipProps = IWithClassName &
  IWithDataTestId & {
    prefix: string;
    suffix?: string;
    showCursor?: boolean;
  };

/**
 * TerminalChip molecule — a monospace, terminal-prompt-styled chip for the
 * wordmark, with an optional blinking cursor. The blink animation is
 * CSS-only (the shared `blink` keyframe) and already respects
 * `prefers-reduced-motion` via the global rule in `configs/tailwind/theme.css`.
 */
export const TerminalChip = ({
  prefix,
  suffix,
  showCursor = true,
  className,
  dataTestId,
}: TTerminalChipProps) => {
  const { root, prompt, text, cursor } = terminalChipVariants();

  return (
    <span className={root({ class: className })} data-testid={dataTestId}>
      <span className={prompt()} aria-hidden="true">
        {'>'}
      </span>
      <span className={text()}>
        {prefix}
        {suffix}
      </span>
      {showCursor && <span className={cursor()} aria-hidden="true" />}
    </span>
  );
};
