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
  isInvalid?: boolean;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * Fuses `FormField` and `TextInput` for the common single-text-field case.
 * `FormField` stays the general primitive for non-text-input controls (e.g.
 * `SegmentedControl`, which has no `htmlFor`).
 */
export const FormTextInput = ({
  label,
  htmlFor,
  hint,
  error,
  footer,
  value,
  onChange,
  type,
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
        value={value}
        onChange={onChange}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        aria-describedby={ariaDescribedBy}
      />
    </FormField>
  );
};
