import { tv } from '@platform/utils/tv/tv';

export const morePresetsPopoverVariants = tv({
  slots: {
    positioner: ['w-(--anchor-width)'],
    header: ['flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2.5'],
    title: ['text-platform-14 font-semibold'],
    count: ['text-platform-12-5 text-platform-muted'],
  },
});
