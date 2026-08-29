'use client';

import { SIDEBAR_COLLAPSED_COOKIE } from '@platform/utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { sidebarCollapseProviderVariants } from './sidebar-collapse-provider-variants';

const SIDEBAR_COLLAPSED_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type TSidebarCollapseContextValue = {
  isCollapsed: boolean;
  toggle: () => void;
};

const SidebarCollapseContext = createContext<
  TSidebarCollapseContextValue | undefined
>(undefined);

export type TSidebarCollapseProviderProps = {
  /** Seeded from the cookie `resolveIsSidebarCollapsed` read server-side. */
  isInitiallyCollapsed: boolean;
  children: ReactNode;
};

/**
 * Wraps `Sidebar` and the rest of `ShellFrame`'s content in a single
 * `data-collapsed`-carrying element, so `Sidebar`'s own server-rendered
 * markup can react to collapse state through a `group-data-*` selector
 * without `Sidebar` itself needing a client boundary — only this provider
 * and the toggle button that calls `useSidebarCollapse` do.
 *
 * This state, not the cookie, is authoritative for the rest of the session:
 * a Next.js layout doesn't re-render on client-side navigation, so writing
 * the cookie alone would never move a toggle that's already on screen.
 */
export const SidebarCollapseProvider = ({
  isInitiallyCollapsed,
  children,
}: TSidebarCollapseProviderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);

  const toggle = useCallback(() => {
    setIsCollapsed((current) => {
      const next = !current;
      document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next}; max-age=${SIDEBAR_COLLAPSED_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
      return next;
    });
  }, []);

  const value = useMemo(() => ({ isCollapsed, toggle }), [isCollapsed, toggle]);

  return (
    <SidebarCollapseContext.Provider value={value}>
      <div
        data-collapsed={isCollapsed ? 'true' : undefined}
        className={sidebarCollapseProviderVariants()}
      >
        {children}
      </div>
    </SidebarCollapseContext.Provider>
  );
};

/** Reads the sidebar's collapse state and toggle — throws outside `SidebarCollapseProvider`. */
export const useSidebarCollapse = (): TSidebarCollapseContextValue => {
  const context = useContext(SidebarCollapseContext);
  if (!context) {
    throw new Error(
      'useSidebarCollapse must be used within a SidebarCollapseProvider',
    );
  }
  return context;
};
