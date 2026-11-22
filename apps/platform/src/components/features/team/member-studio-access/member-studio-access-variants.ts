import { tv } from '@platform/utils/tv/tv';

export const memberStudioAccessVariants = tv({
  slots: {
    root: ['flex flex-col items-start gap-2'],
    status: ['flex flex-wrap items-center gap-2'],
    hint: ['text-platform-12 text-platform-muted'],
  },
});
