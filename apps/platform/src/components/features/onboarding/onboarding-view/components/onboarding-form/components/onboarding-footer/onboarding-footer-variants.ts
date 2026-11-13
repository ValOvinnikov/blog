import { tv } from '@platform/utils/tv/tv';

export const onboardingFooterVariants = tv({
  slots: {
    root: [
      'border-t border-platform-line bg-platform-surface p-4',
      'md:col-start-1 md:row-start-2 md:mx-16 md:max-w-[640px] md:border-platform-line-2 md:px-0 md:pt-5 md:pb-10',
    ],
    failure: ['mb-4'],
  },
});
