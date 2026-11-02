'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TFieldAppearance } from '@platform/constants/field-appearance';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

type TFormFieldControlContext = {
  id?: string;
  describedBy?: string;
  appearance?: TFieldAppearance;
};

const FormFieldControlContext =
  createContext<TMaybeUndefined<TFormFieldControlContext>>(undefined);

type TFormFieldControlProviderProps = TFormFieldControlContext & {
  children: ReactNode;
};

export const FormFieldControlProvider = ({
  id,
  describedBy,
  appearance,
  children,
}: TFormFieldControlProviderProps) => {
  const value = useMemo(
    () => ({ id, describedBy, appearance }),
    [id, describedBy, appearance],
  );

  return (
    <FormFieldControlContext.Provider value={value}>
      {children}
    </FormFieldControlContext.Provider>
  );
};

export const useFormFieldControl = (): TFormFieldControlContext => {
  const context = useContext(FormFieldControlContext);
  if (!context) {
    throw new Error(
      'useFormFieldControl must be used within a FormField or FormFieldControlProvider',
    );
  }
  return context;
};
