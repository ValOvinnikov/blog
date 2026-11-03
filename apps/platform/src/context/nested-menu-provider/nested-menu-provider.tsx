'use client';

import type { IWithChildren } from '@blog/config/react';
import { createContext, useContext } from 'react';

const NestedMenuContext = createContext(false);

/** Marks a subtree as sitting inside a Base UI menu popup, so a menu rendered there opens as its submenu. */
export const NestedMenuProvider = ({ children }: IWithChildren) => (
  <NestedMenuContext.Provider value={true}>
    {children}
  </NestedMenuContext.Provider>
);

export const useIsNestedMenu = (): boolean => useContext(NestedMenuContext);
