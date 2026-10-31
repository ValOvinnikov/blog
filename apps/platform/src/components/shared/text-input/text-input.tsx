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
  const { id, describedBy } = useFormFieldControl();

  return (
    <Input
      ref={ref}
      id={id}
      type={type}
      placeholder={placeholder}
      readOnly={Boolean(isReadOnly)}
      value={value}
      onValueChange={(nextValue) => onChange(nextValue)}
      aria-describedby={describedBy}
      className={({ disabled }) =>
        textInputVariants({
          isDisabled: disabled,
          isReadOnly,
          class: className,
        })
      }
    />
  );
};
