import { tv } from '@platform/utils/tv/tv';

export const onboardingStepHeaderVariants = tv({
  slots: {
    root: ['flex flex-col gap-1.5'],
    progress: ['hidden text-admin-13 font-semibold md:block'],
    title: [
      'leading-[1.2] tracking-normal md:text-admin-28 md:tracking-[-0.2px]',
    ],
  },
});
