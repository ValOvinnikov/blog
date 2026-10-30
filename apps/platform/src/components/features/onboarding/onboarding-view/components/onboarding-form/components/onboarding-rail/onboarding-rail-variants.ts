import { tv } from '@platform/utils/tv/tv';

export const onboardingRailVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center gap-3 border-b border-admin-side-line bg-admin-side px-4 py-3 text-admin-side-text',
      'md:sticky md:top-0 md:h-dvh md:flex-col md:flex-nowrap md:items-stretch md:gap-0 md:overflow-y-auto md:border-r md:border-b-0 md:px-6 md:py-7',
    ],
    brand: ['flex-1 md:flex-none'],
    intro: ['mt-11 hidden md:flex'],
    list: ['mt-8 hidden flex-col gap-1 md:flex'],
    account: ['md:mt-auto md:pt-8'],
  },
});
