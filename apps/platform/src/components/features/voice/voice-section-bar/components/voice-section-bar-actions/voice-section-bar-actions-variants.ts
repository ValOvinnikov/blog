import { tv } from '@platform/utils/tv/tv';

export const voiceSectionBarActionsVariants = tv({
  slots: {
    textButtons: ['hidden shrink-0 items-center gap-1.5 lg:flex'],
    divider: ['h-7 w-px shrink-0 bg-platform-line md:h-6 lg:hidden'],
    iconButton: [
      'shrink-0 rounded-platform lg:hidden md:size-8 md:rounded-platform-control md:hover:bg-platform-surface-2',
      '[&_svg]:size-4.5 md:[&_svg]:size-4',
    ],
  },
});
