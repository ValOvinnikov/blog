import { tv } from '@platform/utils/tv/tv';

export const subscribersNoticeVariants = tv({
  slots: {
    wide: ['max-md:hidden'],
    narrow: ['md:hidden'],
    lead: ['font-semibold'],
  },
});
