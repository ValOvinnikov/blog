import 'server-only';

import { SIDEBAR_COLLAPSED_COOKIE } from '@platform/utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie';
import { cookies } from 'next/headers';

/**
 * Reads the sidebar's collapsed preference for `AdminShell`'s first paint.
 * Each gated layout calls this itself rather than `AdminShell` calling it —
 * `AdminShell` stays a synchronous Server Component so it keeps rendering
 * the same way in a plain (non-RSC) test render.
 */
export const resolveIsSidebarCollapsed = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  return cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === 'true';
};
