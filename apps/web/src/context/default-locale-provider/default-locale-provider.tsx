'use client';

import type { TLocaleIsoCode } from '@shinefold/config';
import { routing } from '@web/i18n/routing';
import { createContext, type ReactNode, useContext } from 'react';

const DefaultLocaleContext = createContext<TLocaleIsoCode>(
  routing.defaultLocale,
);

export interface IDefaultLocaleProviderProps {
  value: TLocaleIsoCode;
  children: ReactNode;
}

export const DefaultLocaleProvider = ({
  value,
  children,
}: IDefaultLocaleProviderProps) => (
  <DefaultLocaleContext.Provider value={value}>
    {children}
  </DefaultLocaleContext.Provider>
);

export const useDefaultLocale = (): TLocaleIsoCode =>
  useContext(DefaultLocaleContext);
