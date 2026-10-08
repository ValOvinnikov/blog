'use client';

import { Field } from '@base-ui/react/field';
import type { AriaAttributes } from 'react';

import { textareaVariants, type TTextareaVariants } from './textarea-variants';

export type TTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  id?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  isRequired?: boolean;
  isDisabled?: TTextareaVariants['isDisabled'];
  isReadOnly?: TTextareaVariants['isReadOnly'];
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  className?: string;
};

export const Textarea = ({
  value,
  onChange,
  ariaLabel,
  id,
  placeholder,
  rows,
  maxLength,
  isRequired,
  isDisabled,
  isReadOnly,
  'aria-describedby': ariaDescribedBy,
  className,
}: TTextareaProps) => {
  return (
    <Field.Control
      render={<textarea rows={rows} />}
      id={id}
      placeholder={placeholder}
      maxLength={maxLength}
      required={isRequired}
      disabled={Boolean(isDisabled)}
      readOnly={Boolean(isReadOnly)}
      value={value}
      onValueChange={(nextValue) => onChange(nextValue)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={textareaVariants({ isDisabled, isReadOnly, class: className })}
    />
  );
};
