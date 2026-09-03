import type { AriaAttributes, ChangeEvent } from 'react';

import {
  textInputVariants,
  type TTextInputVariants,
} from './text-input-variants';

export type TTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  /**
   * Marks that a sibling component (not a `FormField` ancestor) renders this
   * input's associated `<label htmlFor>` — satisfies the accessible-name
   * lint rule without this component rendering anything extra.
   */
  hasExternalLabel?: boolean;
  id?: string;
  type?: string;
  placeholder?: string;
  isRequired?: boolean;
  isInvalid?: TTextInputVariants['isInvalid'];
  isDisabled?: TTextInputVariants['isDisabled'];
  isReadOnly?: TTextInputVariants['isReadOnly'];
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  className?: string;
};

export const TextInput = ({
  value,
  onChange,
  ariaLabel,
  id,
  type,
  placeholder,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  'aria-describedby': ariaDescribedBy,
  className,
}: TTextInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      required={isRequired}
      disabled={Boolean(isDisabled)}
      readOnly={Boolean(isReadOnly)}
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
      aria-invalid={Boolean(isInvalid)}
      aria-describedby={ariaDescribedBy}
      className={textInputVariants({
        isInvalid,
        isDisabled,
        isReadOnly,
        class: className,
      })}
    />
  );
};
