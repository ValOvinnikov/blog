import { tv } from '@platform/utils/tv/tv';

export const topbarVariants = tv({
  slots: {
    root: [
      'sticky top-0 z-10 flex items-center gap-3.5',
      'border-b border-admin-line bg-admin-bg/90 px-4 py-[11px] backdrop-blur-sm',
      'md:px-[26px]',
    ],
    chip: [
      'ml-auto inline-flex shrink-0 items-center gap-[7px] rounded-full border border-admin-line',
      'bg-admin-surface p-1 text-xs whitespace-nowrap text-admin-muted shadow-admin',
      'md:py-1 md:pr-[11px] md:pl-1.5',
    ],
    chipDot: ['hidden size-[7px] shrink-0 rounded-full bg-admin-ok md:block'],
    chipText: ['sr-only md:not-sr-only'],
  },
});
