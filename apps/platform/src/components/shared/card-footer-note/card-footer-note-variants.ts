import { tv } from '@platform/utils/tv/tv';

export const cardFooterNoteVariants = tv({
  slots: {
    footer: ['items-start gap-2 px-4 md:px-platform-card'],
    icon: ['mt-px text-platform-muted'],
    note: ['leading-platform-18'],
  },
});
