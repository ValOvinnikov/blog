'use client';

import { Field } from '@base-ui/react/field';
import { useFormFieldControl } from '@platform/components/shared/form-field';
import {
  textInputVariants,
  type TTextInputVariants,
} from '@platform/components/shared/text-input/text-input-variants';

export type TTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  isReadOnly?: TTextInputVariants['isReadOnly'];
  className?: string;
};

export const Textarea = ({
  value,
  onChange,
  placeholder,
  rows,
  isReadOnly,
  className,
}: TTextareaProps) => {
  const { id, describedBy } = useFormFieldControl();

  return (
    <Field.Control
      render={<textarea rows={rows} />}
      id={id}
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
