import { tv } from '@platform/utils/tv/tv';

export const onboardingStepHeaderVariants = tv({
  slots: {
    root: ['flex flex-col gap-1.5'],
    progress: ['hidden font-semibold md:block'],
  },
});
