import { tv } from '@platform/utils/tv/tv';

export const lookSamplePostsVariants = tv({
  slots: {
    // The device frame stands in for the viewport, so 40rem mirrors the site's `sm`.
    cards: ['grid grid-cols-1 gap-4 @[40rem]:grid-cols-2'],
  },
});
