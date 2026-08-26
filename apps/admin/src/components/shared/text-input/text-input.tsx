import type { AriaAttributes, ChangeEvent } from 'react';

import {
  textInputVariants,
  type TTextInputVariants,
} from './text-input-variants';

export type TTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  id?: string;
  type?: string;
  placeholder?: string;
  isRequired?: boolean;
  isInvalid?: TTextInputVariants['isInvalid'];
  isDisabled?: TTextInputVariants['isDisabled'];
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
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
      aria-invalid={Boolean(isInvalid)}
      aria-describedby={ariaDescribedBy}
      className={textInputVariants({ isInvalid, isDisabled, class: className })}
    />
  );
};
