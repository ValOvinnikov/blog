'use client';

import { Input } from '@base-ui/react/input';
import { useFormFieldControl } from '@platform/components/shared/form-field';

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
};

export const TextInput = ({
  value,
  onChange,
  type,
  placeholder,
  isReadOnly,
  className,
}: TTextInputProps) => {
  const { id, describedBy } = useFormFieldControl();

  return (
    <Input
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
