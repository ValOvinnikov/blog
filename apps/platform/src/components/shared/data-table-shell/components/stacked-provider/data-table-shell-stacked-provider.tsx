'use client';

import {
  DataTableShellStackedContext,
  type TDataTableShellStackedLabels,
} from '@platform/components/shared/data-table-shell/data-table-shell-stacked-context';
import type { TMaybeUndefined } from '@shinefold/config';
import type { ReactNode } from 'react';

export type TDataTableShellStackedProviderProps = {
  labels: TMaybeUndefined<TDataTableShellStackedLabels>;
  children: ReactNode;
};

export const DataTableShellStackedProvider = ({
  labels,
  children,
}: TDataTableShellStackedProviderProps) => (
  <DataTableShellStackedContext.Provider value={labels}>
    {children}
  </DataTableShellStackedContext.Provider>
);
