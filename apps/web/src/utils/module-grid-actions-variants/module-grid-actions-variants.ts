import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const moduleGridActionsVariants = tv({
  slots: {
    grid: ['gap-3.5 md:gap-5 lg:gap-7'],
    actions: ['flex flex-wrap gap-3 mt-7'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { actions: ['justify-start'] },
      [CONTENT_ALIGNMENT.CENTER]: { actions: ['justify-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { actions: ['justify-end'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
