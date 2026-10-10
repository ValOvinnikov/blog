'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

type TFormFieldControlContext = {
  id?: string;
  describedBy?: string;
};

const FormFieldControlContext = createContext<TFormFieldControlContext>({});

type TFormFieldControlProviderProps = TFormFieldControlContext & {
  children: ReactNode;
};

export const FormFieldControlProvider = ({
  id,
  describedBy,
  children,
}: TFormFieldControlProviderProps) => {
  const value = useMemo(() => ({ id, describedBy }), [id, describedBy]);

  return (
    <FormFieldControlContext.Provider value={value}>
      {children}
    </FormFieldControlContext.Provider>
  );
};

export const useFormFieldControl = () => useContext(FormFieldControlContext);
