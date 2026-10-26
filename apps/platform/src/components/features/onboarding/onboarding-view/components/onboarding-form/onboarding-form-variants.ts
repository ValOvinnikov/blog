import { tv } from '@platform/utils/tv/tv';

export const onboardingFormVariants = tv({
  slots: {
    root: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    fields: ['flex flex-col gap-4'],
    preview: ['lg:sticky lg:top-4 lg:self-start'],
    submit: ['w-full justify-center'],
  },
});
