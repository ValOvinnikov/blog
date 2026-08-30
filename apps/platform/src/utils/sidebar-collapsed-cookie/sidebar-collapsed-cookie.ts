/**
 * The admin shell's sidebar-collapsed preference — read server-side
 * (`resolveIsSidebarCollapsed`) so the first paint already matches it,
 * written client-side (`SidebarCollapseProvider`) so a toggle takes effect
 * immediately without waiting on a navigation to pick up a fresh cookie.
 */
export const SIDEBAR_COLLAPSED_COOKIE = 'admin-sidebar-collapsed';
