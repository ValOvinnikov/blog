import { tv } from '@blog/ui/lib/styling';

export const dialogVariants = tv({
  slots: {
    backdrop: [
      'fixed inset-0 z-50',
      'bg-black/50',
      'transition-opacity duration-base ease-smooth motion-reduce:transition-none',
      'data-starting-style:opacity-0 data-ending-style:opacity-0',
    ],
    popup: [
      'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
      'flex w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-y-auto p-6',
      'rounded-md border border-border bg-surface text-text shadow-float',
      'transition-[opacity,scale] duration-base ease-smooth motion-reduce:transition-none',
      'data-starting-style:scale-95 data-starting-style:opacity-0',
      'data-ending-style:scale-95 data-ending-style:opacity-0',
    ],
    header: ['flex items-start justify-between gap-4'],
    heading: ['text-text'],
    close: ['shrink-0'],
  },
});
