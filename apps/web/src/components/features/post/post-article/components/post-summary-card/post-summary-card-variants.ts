import { tv } from '@shinefold/ui/lib/styling';

export const postSummaryCardVariants = tv({
  slots: {
    root: [
      'flex flex-col items-start gap-4 p-5 sm:p-6',
      'rounded-card border border-border-strong bg-surface',
    ],
    header: ['flex flex-wrap items-baseline gap-x-3 gap-y-1'],
    time: ['inline-flex items-center gap-1.5 text-muted'],
    body: ['max-w-measure'],
    list: ['flex list-disc flex-col gap-2 ps-5'],
  },
});
