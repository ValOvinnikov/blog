import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import type { AriaAttributes, ReactNode } from 'react';

export type TFormTextInputProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  footer?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const FormTextInput = ({
  label,
  hint,
  error,
  footer,
  value,
  onChange,
  type,
  placeholder,
  isDisabled,
  'aria-describedby': ariaDescribedBy,
}: TFormTextInputProps) => {
  return (
    <FormField label={label} hint={hint} error={error} footer={footer}>
      <TextInput
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        aria-describedby={ariaDescribedBy}
      />
    </FormField>
  );
};
