import { tv } from '@platform/utils/tv/tv';

export const voiceAnchorVariants = tv({
  // 16px below the top bar: <html> scroll padding is 68, the drawn bar 67 below md and 59 from md.
  base: ['scroll-mt-[15px] md:scroll-mt-[7px]'],
});
