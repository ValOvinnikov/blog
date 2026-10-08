import { tv } from '@platform/utils/tv/tv';

export const voiceFieldStatusVariants = tv({
  slots: {
    root: ['inline-flex shrink-0 items-center gap-2'],
    unsavedDot: ['inline-block size-2 rounded-full bg-admin-warn'],
    unsavedLabel: ['sr-only'],
  },
});
