import { tv } from '@platform/utils/tv/tv';

export const usageFailedVariants = tv({
  slots: {
    root: ['flex items-start gap-2'],
    icon: ['mt-px shrink-0 text-platform-warn'],
    message: ['m-0 text-platform-13 leading-platform-18 text-platform-muted'],
  },
});
