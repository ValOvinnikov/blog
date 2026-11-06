import { tv } from '@platform/utils/tv/tv';

export const signInAppCardFooterVariants = tv({
  slots: {
    status: [
      'min-w-0 flex-1 text-admin-12-5 leading-admin-18 font-medium text-admin-ok',
    ],
    saveButton: ['ml-auto w-full md:w-auto'],
  },
});
