import { tv } from '@platform/utils/tv/tv';

export const signUpFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    legalLink: [
      'font-medium text-admin-brand underline underline-offset-2',
      'rounded-[2px] outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
    submit: ['w-full justify-center'],
  },
});
