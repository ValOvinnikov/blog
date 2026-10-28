import { tv } from '@platform/utils/tv/tv';

export const lookSampleVariants = tv({
  slots: {
    root: ['flex flex-col gap-3'],
    actionsRow: ['flex flex-wrap items-center gap-2 pt-1'],
    // The preview frame stands in for the viewport, so 40rem mirrors the site's `sm`.
    cards: ['grid grid-cols-1 gap-3 pt-1 @[40rem]:grid-cols-2'],
    outlinedCard: ['@[40rem]:col-span-2'],
  },
});
