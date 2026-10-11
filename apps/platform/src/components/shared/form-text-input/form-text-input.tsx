import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import type { ReactNode } from 'react';

export type TFormTextInputProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
};

export const FormTextInput = ({
  label,
  hint,
  error,
  value,
  onChange,
  type,
  placeholder,
}: TFormTextInputProps) => {
  return (
    <FormField label={label} hint={hint} error={error}>
      <TextInput
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </FormField>
  );
};
