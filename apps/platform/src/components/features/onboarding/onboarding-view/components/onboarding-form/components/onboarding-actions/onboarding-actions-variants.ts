import { tv } from '@platform/utils/tv/tv';

export const onboardingActionsVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center justify-end gap-2'],
    back: ['mr-auto'],
    status: ['order-first basis-full sm:order-none sm:flex-1 sm:basis-0'],
  },
});
