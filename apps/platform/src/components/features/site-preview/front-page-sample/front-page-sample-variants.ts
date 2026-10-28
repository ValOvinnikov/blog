import { tv } from '@platform/utils/tv/tv';

export const frontPageSampleVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    hero: ['flex flex-col items-start gap-3 pt-4'],
    posts: ['grid grid-cols-1 gap-4 @[28rem]:grid-cols-3'],
  },
});
