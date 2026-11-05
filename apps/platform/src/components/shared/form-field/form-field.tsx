'use client';

import { Field } from '@base-ui/react/field';
import { FieldLabel } from '@platform/components/shared/field-label';
import { textVariants } from '@platform/components/shared/text/text-variants';
import {
  FIELD_APPEARANCE,
  type TFieldAppearance,
} from '@platform/constants/field-appearance';
import { tv } from '@platform/utils/tv/tv';
import type { ReactNode } from 'react';

import { FormFieldControlProvider } from './form-field-control-provider';

const formFieldVariants = tv({
  slots: {
    root: ['flex flex-col'],
    header: ['flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5'],
    label: ['flex items-center gap-[7px]', 'font-semibold text-admin-text'],
    hint: [],
    error: ['text-admin-bad'],
  },
  variants: {
    appearance: {
      [FIELD_APPEARANCE.DEFAULT]: {
        root: ['gap-[5px]'],
        label: ['text-admin-13'],
        error: ['text-admin-11-5'],
      },
      [FIELD_APPEARANCE.WIZARD]: {
        root: ['gap-1.5'],
        label: ['text-admin-13-5'],
        hint: ['leading-admin-1-45'],
        error: ['text-admin-12 leading-admin-1-45 font-medium'],
      },
    },
  },
  defaultVariants: {
    appearance: FIELD_APPEARANCE.DEFAULT,
  },
});

type TFormFieldControl = {
  id?: string;
  isDisabled?: boolean;
  describedBy?: string;
  hasOwnAccessibleName?: boolean;
  appearance?: TFieldAppearance;
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
  const {
    id,
    isDisabled = false,
    describedBy,
    hasOwnAccessibleName,
    appearance = FIELD_APPEARANCE.DEFAULT,
  } = control;
  const {
    root,
    header,
    label: labelSlot,
    hint: hintSlot,
    error: errorSlot,
  } = formFieldVariants({ appearance });
  const isHintBelow = appearance === FIELD_APPEARANCE.WIZARD;
  const hintNode = hint && (
    <Field.Description
      className={textVariants({ variant: 'hint', class: hintSlot() })}
    >
      {hint}
    </Field.Description>
  );

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
          <FieldLabel className={labelSlot()}>{label}</FieldLabel>
        )}
        {actions}
      </div>
      {!isHintBelow && hintNode}
      <FormFieldControlProvider
        id={id}
        describedBy={describedBy}
        appearance={appearance}
      >
        {children}
      </FormFieldControlProvider>
      {isHintBelow && hintNode}
      {error && (
        <Field.Error match={true} className={errorSlot()}>
          {error}
        </Field.Error>
      )}
      {footer}
    </Field.Root>
  );
};
