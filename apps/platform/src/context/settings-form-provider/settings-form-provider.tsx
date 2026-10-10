'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

type TSettingsFormState = {
  isArchived: boolean;
  isPending: boolean;
  archivedDescribedBy: string | undefined;
};

const NOT_IN_A_FORM: TSettingsFormState = {
  isArchived: false,
  isPending: false,
  archivedDescribedBy: undefined,
};

const SettingsFormContext = createContext<TSettingsFormState>(NOT_IN_A_FORM);

type TSettingsFormProviderProps = {
  isArchived: boolean;
  isPending: boolean;
  archivedNoticeId: string;
  children: ReactNode;
};

export const SettingsFormProvider = ({
  isArchived,
  isPending,
  archivedNoticeId,
  children,
}: TSettingsFormProviderProps) => {
  const value = useMemo(
    () => ({
      isArchived,
      isPending,
      archivedDescribedBy: isArchived ? archivedNoticeId : undefined,
    }),
    [isArchived, isPending, archivedNoticeId],
  );

  return (
    <SettingsFormContext.Provider value={value}>
      {children}
    </SettingsFormContext.Provider>
  );
};

export const useSettingsFormState = () => useContext(SettingsFormContext);
