import 'server-only';

import { readRenamedCookie } from '@platform/server/renamed-cookie/read-renamed-cookie';
import {
  LEGACY_SIDEBAR_COLLAPSED_COOKIE,
  SIDEBAR_COLLAPSED_COOKIE,
} from '@platform/utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie';

// Each gated layout calls this so `PlatformShell` can stay a synchronous Server Component.
export const resolveIsSidebarCollapsed = async (): Promise<boolean> => {
  const isCollapsed = await readRenamedCookie({
    name: SIDEBAR_COLLAPSED_COOKIE,
    legacyName: LEGACY_SIDEBAR_COLLAPSED_COOKIE,
  });
  return isCollapsed === 'true';
};
