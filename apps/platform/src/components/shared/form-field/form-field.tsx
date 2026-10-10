'use client';

import { Field } from '@base-ui/react/field';
import { textVariants } from '@platform/components/shared/text/text-variants';
import type { ReactNode } from 'react';

import { FormFieldControlProvider } from './form-field-control-provider';
import { formFieldVariants } from './form-field-variants';

type TFormFieldControl = {
  id?: string;
  isDisabled?: boolean;
  describedBy?: string;
  hasOwnAccessibleName?: boolean;
};

export type TFormFieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  control?: TFormFieldControl;
};

export const FormField = ({
  label,
  hint,
  error,
  children,
  footer,
  actions,
  control = {},
}: TFormFieldProps) => {
  const { id, isDisabled = false, describedBy, hasOwnAccessibleName } = control;
  const {
    root,
    header,
    label: labelSlot,
    error: errorSlot,
  } = formFieldVariants();

  return (
    <Field.Root
      className={root()}
      invalid={Boolean(error)}
      disabled={isDisabled}
    >
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
      <FormFieldControlProvider id={id} describedBy={describedBy}>
        {children}
      </FormFieldControlProvider>
      {error && (
        <Field.Error match={true} className={errorSlot()}>
          {error}
        </Field.Error>
      )}
      {footer}
    </Field.Root>
  );
};
