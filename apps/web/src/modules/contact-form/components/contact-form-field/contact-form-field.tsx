import type { IWithClassName, TMaybeUndefined } from '@blog/config';
import type { ReactNode } from 'react';

import { contactFormFieldVariants } from './contact-form-field-variants';

export type TContactFormFieldProps = IWithClassName & {
  inputId: string;
  label: string;
  errorId: string;
  error: TMaybeUndefined<string>;
  children: ReactNode;
};

export const ContactFormField = ({
  inputId,
  label,
  errorId,
  error,
  children,
  className,
}: TContactFormFieldProps) => {
  const s = contactFormFieldVariants();

  return (
    <div className={s.root({ class: className })}>
      <label htmlFor={inputId} className={s.label()}>
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className={s.error()}>
          {error}
        </p>
      )}
    </div>
  );
};
