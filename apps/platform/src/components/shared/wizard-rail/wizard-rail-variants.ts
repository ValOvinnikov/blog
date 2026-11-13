import { tv } from '@platform/utils/tv/tv';

export const wizardRailVariants = tv({
  slots: {
    root: ['h-full'],
    list: ['flex flex-col'],
    item: ['flex flex-1 flex-wrap gap-2.5'],
    stepBody: ['flex min-w-0 flex-1 flex-col pb-[9px]'],
    stepTitle: ['text-platform-13-5 font-semibold text-platform-text'],
    stepDescription: ['text-platform-12 text-platform-muted'],
  },
});
