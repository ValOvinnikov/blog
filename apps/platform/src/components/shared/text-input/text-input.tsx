'use client';

import { Input } from '@base-ui/react/input';
import { useFormFieldControl } from '@platform/components/shared/form-field';
import type { Ref } from 'react';

import {
  textInputVariants,
  type TTextInputVariants,
} from './text-input-variants';

export type TTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  isReadOnly?: TTextInputVariants['isReadOnly'];
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

export const TextInput = ({
  value,
  onChange,
  type,
  placeholder,
  isReadOnly,
  className,
  ref,
}: TTextInputProps) => {
  const { id, describedBy, appearance, isLocked } = useFormFieldControl();
  const isInert = Boolean(isReadOnly || isLocked);

  return (
    <Input
      ref={ref}
      id={id}
      type={type}
      placeholder={placeholder}
      readOnly={isInert}
      value={value}
      onValueChange={(nextValue) => onChange(nextValue)}
      aria-describedby={describedBy}
      aria-disabled={isLocked || undefined}
      className={({ disabled }) =>
        textInputVariants({
          appearance,
          isDisabled: disabled,
          isReadOnly: isInert,
          class: className,
        })
      }
    />
  );
};
