import type { ReactNode } from 'react';

import { formFieldVariants } from './form-field-variants';

export type TFormFieldProps = {
  label: string;
  /**
   * The control's id, wired to the label's `htmlFor` and used to derive the
   * error message's id. Omit for a control with no native id (e.g. a
   * SegmentedControl) — the label then renders as a plain styled span.
   */
  htmlFor?: string;
  /**
   * Secondary text between the control and the error message. Left to the
   * caller to style and wrap (e.g. its own hint or lock-reason span), since
   * the two current call sites use different tokens for it.
   */
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  /** Extra content after the error message, e.g. an inline confirmation alert. */
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
        <span id={errorId} className={errorSlot()}>
          {error}
        </span>
      )}
      {footer}
    </div>
  );
};
