'use client';

import type { TMaybeUndefined } from '@shinefold/config';
import { createContext, useContext, type ReactNode } from 'react';

export type TDataTableShellStackedLabels = Record<string, ReactNode>;

export const DataTableShellStackedContext =
  createContext<TMaybeUndefined<TDataTableShellStackedLabels>>(undefined);

export const useDataTableShellStackedLabels = () =>
  useContext(DataTableShellStackedContext);
