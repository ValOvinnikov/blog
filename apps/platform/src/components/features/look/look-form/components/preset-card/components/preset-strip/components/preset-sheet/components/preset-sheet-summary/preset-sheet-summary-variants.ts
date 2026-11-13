import { tv } from '@platform/utils/tv/tv';

export const presetSheetSummaryVariants = tv({
  slots: {
    text: ['flex min-w-0 flex-1 flex-col'],
    name: ['text-platform-14 font-semibold text-platform-text'],
    description: ['truncate text-platform-12-5 text-platform-muted'],
    meta: ['shrink-0 text-platform-12-5 text-platform-muted'],
  },
});
