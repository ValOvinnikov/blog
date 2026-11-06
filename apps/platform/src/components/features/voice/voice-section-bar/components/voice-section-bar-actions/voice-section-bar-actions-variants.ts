import { tv } from '@platform/utils/tv/tv';

export const voiceSectionBarActionsVariants = tv({
  slots: {
    textButtons: ['flex shrink-0 items-center gap-1.5'],
    divider: ['h-7 w-px shrink-0 bg-admin-line md:h-6'],
    iconButton: [
      'shrink-0 rounded-admin md:size-8 md:rounded-admin-control md:hover:bg-admin-surface-2',
      '[&_svg]:size-4.5 md:[&_svg]:size-4',
    ],
  },
});
