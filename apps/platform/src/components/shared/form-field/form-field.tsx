'use client';

import { Field } from '@base-ui/react/field';
import { textVariants } from '@platform/components/shared/text/text-variants';
import type { ReactNode } from 'react';

import { formFieldVariants } from './form-field-variants';

export type TFormFieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  hasOwnAccessibleName?: boolean;
};

export const FormField = ({
  label,
  hint,
  error,
  children,
  footer,
  actions,
  hasOwnAccessibleName = false,
}: TFormFieldProps) => {
  const {
    root,
    header,
    label: labelSlot,
    error: errorSlot,
  } = formFieldVariants();

  return (
    <Field.Root className={root()} invalid={Boolean(error)}>
      <div className={header()}>
        {hasOwnAccessibleName ? (
          <span className={labelSlot()}>{label}</span>
        ) : (
          <Field.Label className={labelSlot()}>{label}</Field.Label>
        )}
        {actions}
      </div>
      {hint && (
        <Field.Description className={textVariants({ variant: 'hint' })}>
          {hint}
        </Field.Description>
      )}
      {children}
      {error && (
        <Field.Error match={true} className={errorSlot()}>
          {error}
        </Field.Error>
      )}
      {footer}
    </Field.Root>
  );
};
