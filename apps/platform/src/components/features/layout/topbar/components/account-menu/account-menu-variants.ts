import { tv } from '@platform/utils/tv/tv';

export const accountMenuVariants = tv({
  slots: {
    trigger: [
      'ml-auto inline-flex shrink-0 items-center gap-[7px] rounded-full border border-admin-line',
      'bg-admin-surface p-1 text-xs whitespace-nowrap text-admin-muted shadow-admin',
      'md:py-1 md:pr-[11px] md:pl-1.5',
      'transition-colors duration-base ease-smooth',
      'hover:border-admin-brand hover:text-admin-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg',
      'data-[popup-open]:border-admin-brand data-[popup-open]:text-admin-text',
    ],
    dot: ['hidden size-[7px] shrink-0 rounded-full bg-admin-ok md:block'],
    text: ['sr-only md:not-sr-only'],
    popup: [
      'min-w-44 rounded-admin border border-admin-line bg-admin-surface p-1',
      'shadow-admin-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center rounded-admin-control px-2.5 py-1.5',
      'text-[13px] text-admin-text outline-none md:min-h-0',
      'data-[highlighted]:bg-admin-surface-2',
    ],
  },
});
