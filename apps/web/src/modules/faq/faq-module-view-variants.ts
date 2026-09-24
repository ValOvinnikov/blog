import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const faqModuleViewVariants = tv({
  slots: {
    wrapper: ['max-w-post'],
    actions: ['flex flex-wrap gap-3 mt-7'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { actions: ['justify-start'] },
      [CONTENT_ALIGNMENT.CENTER]: {
        wrapper: ['mx-auto'],
        actions: ['justify-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        wrapper: ['ml-auto'],
        actions: ['justify-end'],
      },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
