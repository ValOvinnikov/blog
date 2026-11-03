'use client';

import { createContext, useContext, type ReactNode } from 'react';

const NestedMenuContext = createContext(false);

type TNestedMenuProviderProps = {
  children: ReactNode;
};

/** Marks a subtree as sitting inside a Base UI menu popup, so a menu rendered there opens as its submenu. */
export const NestedMenuProvider = ({ children }: TNestedMenuProviderProps) => (
  <NestedMenuContext.Provider value={true}>
    {children}
  </NestedMenuContext.Provider>
);

export const useIsNestedMenu = (): boolean => useContext(NestedMenuContext);
