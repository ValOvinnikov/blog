import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const faqModuleViewVariants = tv({
  slots: {
    wrapper: ['max-w-post'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: { wrapper: ['mx-auto'] },
      [CONTENT_ALIGNMENT.RIGHT]: { wrapper: ['ml-auto'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
