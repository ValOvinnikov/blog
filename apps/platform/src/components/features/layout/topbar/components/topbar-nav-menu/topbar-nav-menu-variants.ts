import { tv } from '@platform/utils/tv/tv';

export const topbarNavMenuVariants = tv({
  slots: {
    trigger: [
      'md:hidden',
      'inline-flex size-11 shrink-0 items-center justify-center rounded-admin-control',
      'border border-admin-control-line bg-admin-surface text-admin-muted',
      'transition-colors duration-base ease-smooth',
      'hover:border-admin-brand hover:text-admin-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg',
      'data-[popup-open]:border-admin-brand data-[popup-open]:text-admin-text',
    ],
    popup: [
      'w-72 max-w-[calc(100vw-2rem)] overflow-y-auto p-1.5',
      'max-h-[var(--available-height)]',
    ],
    sectionLabel: ['text-admin-muted'],
    row: ['min-h-11 text-admin-text md:min-h-0'],
    note: ['text-admin-muted'],
  },
});
