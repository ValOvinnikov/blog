'use client';

import type { TLocaleIsoCode } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { routing } from '@web/i18n/routing';
import { createContext, useContext } from 'react';

const DefaultLocaleContext = createContext<TLocaleIsoCode>(
  routing.defaultLocale,
);

export interface IDefaultLocaleProviderProps extends IWithChildren {
  value: TLocaleIsoCode;
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
