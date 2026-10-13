import { tv } from '@platform/utils/tv/tv';

export const wizardRailVariants = tv({
  slots: {
    root: ['h-full'],
    list: ['flex flex-col'],
    item: ['flex flex-1 flex-wrap gap-2.5'],
    stepBody: ['flex min-w-0 flex-1 flex-col pb-[9px]'],
    stepTitle: ['text-[13.5px] font-semibold text-admin-text'],
    stepDescription: ['text-[12px] text-admin-muted'],
  },
});
