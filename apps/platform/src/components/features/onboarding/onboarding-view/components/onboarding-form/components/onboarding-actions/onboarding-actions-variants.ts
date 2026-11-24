import { tv } from '@platform/utils/tv/tv';

export const onboardingActionsVariants = tv({
  slots: {
    root: [
      'flex flex-col-reverse gap-2',
      'md:flex-row md:items-center md:justify-end',
    ],
    back: ['w-full md:mr-auto md:w-auto'],
    primary: ['w-full md:w-auto'],
  },
});
