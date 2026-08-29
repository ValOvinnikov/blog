'use client';

import { STUDIO_SEGMENT } from '@platform/utils/routes/routes';
import { useSelectedLayoutSegment } from 'next/navigation';
import type { ReactNode } from 'react';

import { shellFrameVariants } from './shell-frame-variants';

export type TShellFrameProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

/**
 * Owns the sidebar/topbar/content grid on behalf of `AdminShell` — a client
 * leaf so it can read the active route segment. `AdminShell`'s Server
 * Component callers can't: a layout never re-renders on navigation, so it
 * never sees a fresh pathname/segment.
 */
export const ShellFrame = ({ sidebar, topbar, children }: TShellFrameProps) => {
  const segment = useSelectedLayoutSegment();
  const isFullBleed = segment === STUDIO_SEGMENT;
  const { root, main, content } = shellFrameVariants({ isFullBleed });

  return (
    <div className={root()}>
      {sidebar}
      <div className={main()}>
        {topbar}
        <main className={content()}>{children}</main>
      </div>
    </div>
  );
};
