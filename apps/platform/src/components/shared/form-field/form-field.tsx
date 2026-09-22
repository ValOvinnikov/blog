import type { ReactNode } from 'react';

import { formFieldVariants } from './form-field-variants';

export type TFormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export const FormField = ({
  label,
  htmlFor,
  hint,
  error,
  children,
  footer,
}: TFormFieldProps) => {
  const { root, label: labelSlot, error: errorSlot } = formFieldVariants();
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={root()}>
      {htmlFor ? (
        <label className={labelSlot()} htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className={labelSlot()}>{label}</span>
      )}
      {children}
      {hint}
      {error && (
        <span
          id={errorId}
          className={errorSlot()}
          data-testid="form-field-error"
        >
          {error}
        </span>
      )}
      {footer}
    </div>
  );
};
