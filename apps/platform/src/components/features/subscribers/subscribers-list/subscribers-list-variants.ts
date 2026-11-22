import { tv } from '@platform/utils/tv/tv';

export const subscribersListVariants = tv({
  slots: {
    wide: ['max-md:hidden'],
    narrow: ['md:hidden'],
    visuallyHidden: ['sr-only'],
    email: ['font-medium wrap-anywhere'],
    unavailable: ['text-platform-muted'],
    date: ['text-platform-muted'],
  },
});
