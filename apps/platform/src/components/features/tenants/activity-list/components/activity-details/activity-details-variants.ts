import { tv } from '@platform/utils/tv/tv';

export const activityDetailsVariants = tv({
  slots: {
    list: ['flex flex-col gap-0.5', 'text-platform-12 text-platform-muted'],
    item: ['break-words'],
  },
});
