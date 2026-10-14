import 'server-only';

import { SIDEBAR_COLLAPSED_COOKIE } from '@platform/utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie';
import { cookies } from 'next/headers';

// Each gated layout calls this so `AdminShell` can stay a synchronous Server Component.
export const resolveIsSidebarCollapsed = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  return cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === 'true';
};
