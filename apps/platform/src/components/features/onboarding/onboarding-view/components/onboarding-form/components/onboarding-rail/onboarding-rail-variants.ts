import { tv } from '@platform/utils/tv/tv';

export const onboardingRailVariants = tv({
  slots: {
    root: [
      'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-3.5 bg-admin-rail px-4 pt-4 pb-4.5 text-admin-rail-text',
      'md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:items-stretch md:gap-0 md:border-r md:border-admin-rail-line md:px-6 md:py-7',
    ],
    brand: ['min-w-0 md:flex-none'],
    intro: ['mt-11 hidden md:flex'],
    progress: ['col-span-2 md:hidden'],
    list: ['mt-8 hidden flex-col gap-1 md:flex'],
    account: ['col-start-2 row-start-1 md:mt-auto md:pt-8'],
  },
});
