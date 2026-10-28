'use client';

import type { TMaybeUndefined } from '@blog/config';
import { createContext, useContext, type ReactNode } from 'react';

const NavPanelGroupContext = createContext<TMaybeUndefined<string>>(undefined);

export const NavPanelGroupProvider = ({
  groupName,
  children,
}: {
  groupName: string;
  children: ReactNode;
}) => (
  <NavPanelGroupContext.Provider value={groupName}>
    {children}
  </NavPanelGroupContext.Provider>
);

export const useNavPanelGroupName = () => useContext(NavPanelGroupContext);
