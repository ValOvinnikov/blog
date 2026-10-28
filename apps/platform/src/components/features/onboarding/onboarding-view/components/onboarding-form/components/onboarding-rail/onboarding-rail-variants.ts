import { tv } from '@platform/utils/tv/tv';

export const onboardingRailVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-3 border-b border-admin-side-line bg-admin-side px-4 py-3 text-admin-side-text',
      'lg:sticky lg:top-0 lg:h-dvh lg:gap-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-6 lg:py-7',
    ],
    brand: ['flex items-center gap-2.5'],
    brandName: ['text-admin-16 font-bold tracking-[0.2px] text-white'],
    intro: ['mt-11 hidden flex-col gap-2 lg:flex'],
    title: ['text-admin-16 font-semibold text-white'],
    description: ['text-admin-13 text-admin-side-text'],
    progress: ['text-admin-13 font-semibold lg:hidden'],
    list: ['mt-8 hidden flex-col gap-1 lg:flex'],
  },
});
