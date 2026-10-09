import { tv } from '@platform/utils/tv/tv';

export const topbarNavMenuVariants = tv({
  slots: {
    trigger: [
      'md:hidden',
      'inline-flex size-11 shrink-0 items-center justify-center rounded-admin-sm',
      'border border-admin-line bg-admin-surface text-admin-muted',
      'transition-colors duration-base ease-smooth',
      'hover:border-admin-brand hover:text-admin-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg',
      'data-[popup-open]:border-admin-brand data-[popup-open]:text-admin-text',
    ],
    popup: [
      // Portalled to `body`, outside the sidebar, so it carries the
      // sidebar's `--admin-side*` surface itself.
      'w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-admin border',
      'border-admin-side-line bg-admin-side py-2 shadow-admin-lg outline-none',
      'max-h-[var(--available-height)]',
    ],
  },
});
