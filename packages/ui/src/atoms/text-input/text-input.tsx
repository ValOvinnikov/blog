import type { IWithDataTestId } from '@blog/config';
import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import {
  textInputVariants,
  type TTextInputVariants,
} from './text-input-variants';

export type TTextInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'value'
> &
  IWithDataTestId & {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    invalid?: TTextInputVariants['invalid'];
    /** Decorative leading glyph or icon (e.g. `$`, a chevron `Icon`) — the console prompt idiom. Purely visual; `ariaLabel` carries the accessible name. */
    prompt?: ReactNode;
    className?: string;
  };

/**
 * TextInput atom — a pure, controlled single-line field. Holds no state of
 * its own; the caller owns `value` and receives changes via `onChange`. Used
 * as the shared building block for both the comment form and the newsletter
 * signup form.
 */
export const TextInput = ({
  value,
  onChange,
  ariaLabel,
  invalid = false,
  prompt,
  className,
  dataTestId,
  ...rest
}: TTextInputProps) => {
  const {
    root,
    prompt: promptSlot,
    input,
  } = textInputVariants({ invalid, hasPrompt: Boolean(prompt) });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      {prompt && (
        <span className={promptSlot()} aria-hidden="true">
          {prompt}
        </span>
      )}
      <input
        {...rest}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className={input()}
      />
    </div>
  );
};
