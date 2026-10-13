'use client';

import type { TMaybeUndefined } from '@blog/config';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

type TSettingsFormState = {
  isArchived: boolean;
  isPending: boolean;
  archivedDescribedBy: TMaybeUndefined<string>;
};

const SettingsFormContext =
  createContext<TMaybeUndefined<TSettingsFormState>>(undefined);

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

export const useSettingsFormState = (): TSettingsFormState => {
  const context = useContext(SettingsFormContext);
  if (!context) {
    throw new Error(
      'useSettingsFormState must be used within a SettingsFormProvider',
    );
  }
  return context;
};
