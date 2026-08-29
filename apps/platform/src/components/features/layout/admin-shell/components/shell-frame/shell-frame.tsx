'use client';

import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { STUDIO_SEGMENT } from '@platform/utils/routes/routes';
import { useSelectedLayoutSegment } from 'next/navigation';
import type { ReactNode } from 'react';

import { shellFrameVariants } from './shell-frame-variants';

export type TShellFrameProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  /** Seeded from the cookie `AdminShell`'s caller read server-side. */
  isSidebarInitiallyCollapsed?: boolean;
};

/**
 * Owns the sidebar/topbar/content grid on behalf of `AdminShell` — a client
 * leaf so it can read the active route segment. `AdminShell`'s Server
 * Component callers can't: a layout never re-renders on navigation, so it
 * never sees a fresh pathname/segment.
 *
 * Also owns the `SidebarCollapseProvider` boundary: `sidebar` arrives as an
 * already-rendered (server-rendered) `ReactNode`, so nothing further down
 * this tree can hold the collapse state itself — this is the lowest point
 * both the collapse toggle (inside `sidebar`) and the sidebar's own
 * collapse-aware CSS can share it from.
 */
export const ShellFrame = ({
  sidebar,
  topbar,
  children,
  isSidebarInitiallyCollapsed = false,
}: TShellFrameProps) => {
  const segment = useSelectedLayoutSegment();
  const isFullBleed = segment === STUDIO_SEGMENT;
  const { root, main, content } = shellFrameVariants({ isFullBleed });

  return (
    <div className={root()}>
      <SidebarCollapseProvider
        isInitiallyCollapsed={isSidebarInitiallyCollapsed}
      >
        {sidebar}
        <div className={main()}>
          {topbar}
          <main className={content()}>{children}</main>
        </div>
      </SidebarCollapseProvider>
    </div>
  );
};
