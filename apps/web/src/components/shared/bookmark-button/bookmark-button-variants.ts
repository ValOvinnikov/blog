import { tv } from '@blog/ui/lib/styling';

export const bookmarkButtonVariants = tv({
  slots: {
    root: ['relative inline-grid'],
    sizer: ['invisible [grid-area:1/1]'],
    toggle: ['justify-center [grid-area:1/1]'],
  },
});
