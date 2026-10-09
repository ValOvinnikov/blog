'use client';

import { Field } from '@base-ui/react/field';
import type { ReactNode } from 'react';

import { formFieldVariants } from './form-field-variants';

export type TFormFieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  footer?: ReactNode;
  hasOwnAccessibleName?: boolean;
};

export const FormField = ({
  label,
  hint,
  error,
  children,
  footer,
  hasOwnAccessibleName = false,
}: TFormFieldProps) => {
  const {
    root,
    label: labelSlot,
    hint: hintSlot,
    error: errorSlot,
  } = formFieldVariants();

  return (
    <Field.Root className={root()} invalid={Boolean(error)}>
      {hasOwnAccessibleName ? (
        <span className={labelSlot()}>{label}</span>
      ) : (
        <Field.Label className={labelSlot()}>{label}</Field.Label>
      )}
      {children}
      {hint && (
        <Field.Description className={hintSlot()}>{hint}</Field.Description>
      )}
      {error && (
        <Field.Error match={true} className={errorSlot()}>
          {error}
        </Field.Error>
      )}
      {footer}
    </Field.Root>
  );
};
