import type { IWithDataTestId } from '@blog/config';
import type { TBrandMarkVariant } from '@blog/ui/atoms/brand-mark';
import type { ComponentPropsWithoutRef } from 'react';

import {
  terminalChipCursorVariants,
  terminalChipPromptVariants,
  terminalChipRootVariants,
  terminalChipTextVariants,
} from './terminal-chip-variants';

/**
 * Placeholder — the real product name is filled in outside of git history
 * (this repo's public, and the wordmark string must never appear in it).
 * Never replace this with the literal brand name in a commit.
 */
const WORDMARK = 'BRAND';

/** `--logo-alt-accent` has no `@theme inline` utility mapping — Indigo needs inline style. */
const INDIGO_ACCENT = 'var(--logo-alt-accent)';

export interface ITerminalChipProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>, IWithDataTestId {
  variant?: TBrandMarkVariant;
  showCursor?: boolean;
}

/**
 * TerminalChip molecule — a monospace, terminal-prompt-styled chip for the
 * fixed wordmark, with an optional blinking cursor. The blink animation is
 * CSS-only (the shared `blink` keyframe) and already respects
 * `prefers-reduced-motion` via the global rule in `configs/tailwind/theme.css`.
 */
export const TerminalChip = ({
  variant = 'console',
  showCursor = true,
  className,
  dataTestId,
  ...rest
}: ITerminalChipProps) => {
  const accentStyle =
    variant === 'indigo' ? { color: INDIGO_ACCENT } : undefined;
  const cursorStyle =
    variant === 'indigo' ? { backgroundColor: INDIGO_ACCENT } : undefined;

  return (
    <span
      className={terminalChipRootVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <span
        className={terminalChipPromptVariants()}
        style={accentStyle}
        aria-hidden="true"
      >
        {'>'}
      </span>
      <span className={terminalChipTextVariants()}>{WORDMARK}</span>
      {showCursor && (
        <span
          className={terminalChipCursorVariants()}
          style={cursorStyle}
          aria-hidden="true"
        />
      )}
    </span>
  );
};
