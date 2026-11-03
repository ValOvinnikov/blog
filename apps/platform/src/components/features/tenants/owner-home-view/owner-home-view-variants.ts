import { tv } from '@platform/utils/tv/tv';

export const ownerHomeViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-4 md:gap-6'],
    pair: ['grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-6'],
  },
});
