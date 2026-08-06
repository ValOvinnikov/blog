import type { IWithDataTestId } from '@blog/config';
import { type ChangeEvent, type ComponentPropsWithoutRef } from 'react';

import { textareaVariants, type TTextareaVariants } from './textarea-variants';

export type TTextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'onChange' | 'value'
> &
  IWithDataTestId & {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    invalid?: TTextareaVariants['invalid'];
    /** Decorative leading glyph (e.g. `$`, `›`) — the console prompt idiom. Purely visual; `ariaLabel` carries the accessible name. */
    prompt?: string;
    className?: string;
  };

/**
 * Textarea atom — a pure, controlled multi-line field. Holds no state of its
 * own; the caller owns `value` and receives changes via `onChange`. Used as
 * the shared building block for the comment form's body field.
 */
export const Textarea = ({
  value,
  onChange,
  ariaLabel,
  invalid = false,
  prompt,
  rows,
  maxLength,
  className,
  dataTestId,
  ...rest
}: TTextareaProps) => {
  const {
    root,
    prompt: promptSlot,
    textarea,
  } = textareaVariants({ invalid, hasPrompt: Boolean(prompt) });

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      {prompt && (
        <span className={promptSlot()} aria-hidden="true">
          {prompt}
        </span>
      )}
      <textarea
        {...rest}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className={textarea()}
      />
    </div>
  );
};
