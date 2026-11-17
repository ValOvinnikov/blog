'use client';

import { useShellStudioAccess } from '@platform/context/shell-studio-access-provider';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TStudioAccess } from '@shinefold/config/constants';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export type TShellStudioAccessSyncProps = {
  studioAccess: TMaybeUndefined<TStudioAccess>;
};

/** Refreshes the route when the sidebar badge, rendered by a layout that survives client navigation, disagrees with this page's fresh access state. */
export const ShellStudioAccessSync = ({
  studioAccess,
}: TShellStudioAccessSyncProps) => {
  const router = useRouter();
  const isShellStale = useShellStudioAccess() !== studioAccess;

  useEffect(() => {
    if (isShellStale) {
      router.refresh();
    }
  }, [isShellStale, router]);

  return null;
};
