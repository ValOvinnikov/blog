import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import type { AriaAttributes, ReactNode } from 'react';

export type TFormTextInputProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  footer?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const FormTextInput = ({
  label,
  htmlFor,
  hint,
  error,
  footer,
  value,
  onChange,
  type,
  placeholder,
  isInvalid,
  isDisabled,
  'aria-describedby': ariaDescribedBy,
}: TFormTextInputProps) => {
  return (
    <FormField
      label={label}
      htmlFor={htmlFor}
      hint={hint}
      error={error}
      footer={footer}
    >
      <TextInput
        id={htmlFor}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        aria-describedby={ariaDescribedBy}
      />
    </FormField>
  );
};
