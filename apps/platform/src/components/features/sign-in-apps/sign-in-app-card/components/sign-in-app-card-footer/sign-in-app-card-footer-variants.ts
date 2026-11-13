import { tv } from '@platform/utils/tv/tv';

export const signInAppCardFooterVariants = tv({
  slots: {
    status: [
      'min-w-0 flex-1 text-platform-12-5 leading-platform-18 font-medium text-platform-ok',
    ],
    saveButton: ['ml-auto w-full md:w-auto'],
  },
});
