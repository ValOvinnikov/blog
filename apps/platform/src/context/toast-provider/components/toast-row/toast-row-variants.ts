import { tv } from '@platform/utils/tv/tv';

export const toastRowVariants = tv({
  slots: {
    // `contents` keeps the row out of the box tree so ToastViewport still stacks the Toasts themselves.
    row: ['contents'],
  },
});
