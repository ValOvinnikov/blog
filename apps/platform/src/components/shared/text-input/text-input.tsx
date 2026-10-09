'use client';

import { Input } from '@base-ui/react/input';
import type { AriaAttributes } from 'react';

import {
  textInputVariants,
  type TTextInputVariants,
} from './text-input-variants';

export type TTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  isRequired?: boolean;
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
  isDisabled,
  isReadOnly,
  'aria-describedby': ariaDescribedBy,
  className,
}: TTextInputProps) => {
  return (
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      required={isRequired}
      disabled={Boolean(isDisabled)}
      readOnly={Boolean(isReadOnly)}
      value={value}
      onValueChange={(nextValue) => onChange(nextValue)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={textInputVariants({
        isDisabled,
        isReadOnly,
        class: className,
      })}
    />
  );
};
