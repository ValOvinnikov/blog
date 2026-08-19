import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { type ChangeEvent } from 'react';

import { textareaVariants, type TTextareaVariants } from './textarea-variants';

export type TTextareaProps = IWithClassName &
  IWithDataTestId & {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    invalid?: TTextareaVariants['invalid'];
    /** Decorative leading glyph (e.g. `$`, `›`) — the console prompt idiom. Purely visual; `ariaLabel` carries the accessible name. */
    prompt?: string;
    id?: string;
    placeholder?: string;
    rows?: number;
    maxLength?: number;
    disabled?: boolean;
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
  id,
  placeholder,
  disabled,
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
        id={id}
        placeholder={placeholder}
        disabled={disabled}
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
