import { tv } from '@platform/utils/tv/tv';

export const presetSheetSummaryVariants = tv({
  slots: {
    text: ['flex min-w-0 flex-1 flex-col'],
    name: ['text-admin-14 font-semibold text-admin-text'],
    description: ['truncate text-admin-12-5 text-admin-muted'],
    meta: ['shrink-0 text-admin-12-5 text-admin-muted'],
  },
});
