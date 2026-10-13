import 'server-only';

import { getSession } from '@platform/server/auth/auth';
import { resolveIsSidebarCollapsed } from '@platform/server/layout/resolve-is-sidebar-collapsed';
import type { TNavTranslator } from '@platform/utils/nav-sections/nav-sections';
import { getTranslations } from 'next-intl/server';

export const loadAdminShellChrome = async () => {
  const [session, isSidebarInitiallyCollapsed, tNavSections] =
    await Promise.all([
      getSession(),
      resolveIsSidebarCollapsed(),
      getTranslations('navSections'),
    ]);

  return {
    isSidebarInitiallyCollapsed,
    // getTranslations' namespace-literal key generic is not assignable to a plain string key.
    tNavSections: tNavSections as unknown as TNavTranslator,
    userName: session?.user?.name ?? session?.user?.email ?? undefined,
  };
};
