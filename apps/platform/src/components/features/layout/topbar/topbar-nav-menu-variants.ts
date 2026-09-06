import { tv } from '@platform/utils/tv/tv';

export const topbarNavMenuVariants = tv({
  slots: {
    trigger: [
      'md:hidden',
      'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-admin-sm',
      'border border-admin-line bg-admin-surface text-admin-muted',
      'transition-colors duration-base ease-smooth',
      'hover:border-admin-brand hover:text-admin-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg',
      'data-[popup-open]:border-admin-brand data-[popup-open]:text-admin-text',
    ],
    popup: [
      // Base UI portals this to `document.body`, outside the sidebar's own
      // dark island — this popup reproduces the sidebar nav in a portal, so
      // it carries the same `--admin-side*` surface rather than the light
      // topbar tokens the trigger itself sits in.
      'w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-admin border',
      'border-admin-side-line bg-admin-side py-2 shadow-admin-lg outline-none',
      // Bounded by Base UI's own collision-aware available space so the
      // popup never grows past the viewport and covers page content —
      // scrolls internally instead.
      'max-h-[var(--available-height)]',
    ],
  },
});
