import { tv } from '@platform/utils/tv/tv';

export const onboardingActionsVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center justify-end gap-3'],
    back: ['flex-1 md:mr-auto md:flex-none'],
    primary: ['flex-1 md:flex-none'],
    status: ['order-first basis-full md:order-none md:flex-1 md:basis-0'],
  },
});
