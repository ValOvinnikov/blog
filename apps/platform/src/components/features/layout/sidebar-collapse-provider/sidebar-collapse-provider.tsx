'use client';

import type { TMaybeUndefined } from '@blog/config';
import { SIDEBAR_COLLAPSED_COOKIE } from '@platform/utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie';
import { createContext, useContext, useState, type ReactNode } from 'react';

import { sidebarCollapseProviderVariants } from './sidebar-collapse-provider-variants';

const SIDEBAR_COLLAPSED_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type TSidebarCollapseContextValue = {
  isCollapsed: boolean;
  toggle: () => void;
};

const SidebarCollapseContext =
  createContext<TMaybeUndefined<TSidebarCollapseContextValue>>(undefined);

export type TSidebarCollapseProviderProps = {
  isInitiallyCollapsed: boolean;
  children: ReactNode;
};

// This state, not the cookie, is authoritative: a layout never re-renders on client navigation.
export const SidebarCollapseProvider = ({
  isInitiallyCollapsed,
  children,
}: TSidebarCollapseProviderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);

  const toggle = () => {
    const next = !isCollapsed;
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next}; max-age=${SIDEBAR_COLLAPSED_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
    setIsCollapsed(next);
  };

  return (
    <SidebarCollapseContext.Provider value={{ isCollapsed, toggle }}>
      <div
        data-collapsed={isCollapsed ? 'true' : undefined}
        data-testid="sidebar-collapse-root"
        className={sidebarCollapseProviderVariants()}
      >
        {children}
      </div>
    </SidebarCollapseContext.Provider>
  );
};

export const useSidebarCollapse = (): TSidebarCollapseContextValue => {
  const context = useContext(SidebarCollapseContext);
  if (!context) {
    throw new Error(
      'useSidebarCollapse must be used within a SidebarCollapseProvider',
    );
  }
  return context;
};
