import { tv } from '@platform/utils/tv/tv';

export const signInViewVariants = tv({
  slots: {
    content: ['flex flex-col gap-4'],
    providers: ['flex flex-col gap-2'],
    signUpLink: [
      'font-medium text-admin-brand underline-offset-2 hover:underline',
      'rounded-[2px] outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
  },
});
