import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { type AriaAttributes, type ChangeEvent, type ReactNode } from 'react';

import {
  textInputVariants,
  type TTextInputVariants,
} from './text-input-variants';

export type TTextInputProps = IWithClassName &
  IWithDataTestId & {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    isInvalid?: TTextInputVariants['invalid'];
    /** Decorative leading glyph or icon. Purely visual; `ariaLabel` carries the accessible name. */
    leadingIcon?: ReactNode;
    /** Decorative trailing glyph or icon. Purely visual; `ariaLabel` carries the accessible name. */
    trailingIcon?: ReactNode;
    id?: string;
    type?: string;
    placeholder?: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    'aria-describedby'?: AriaAttributes['aria-describedby'];
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
  isInvalid = false,
  leadingIcon,
  trailingIcon,
  className,
  dataTestId,
  id,
  type,
  placeholder,
  isRequired,
  isDisabled,
  'aria-describedby': ariaDescribedby,
}: TTextInputProps) => {
  const {
    root,
    leadingIcon: leadingIconSlot,
    trailingIcon: trailingIconSlot,
    input,
  } = textInputVariants({
    invalid: isInvalid,
    hasLeadingIcon: Boolean(leadingIcon),
    hasTrailingIcon: Boolean(trailingIcon),
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      {leadingIcon && (
        <span className={leadingIconSlot()} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        required={isRequired}
        disabled={isDisabled}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        aria-invalid={isInvalid}
        aria-describedby={ariaDescribedby}
        className={input()}
      />
      {trailingIcon && (
        <span className={trailingIconSlot()} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </div>
  );
};
