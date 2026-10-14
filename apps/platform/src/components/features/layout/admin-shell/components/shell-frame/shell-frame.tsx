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
  isSidebarInitiallyCollapsed?: boolean;
};

// A client leaf so it can read the active segment, which a layout never re-renders to see.
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
