import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const faqModuleViewVariants = tv({
  slots: {
    wrapper: ['w-full max-w-measure text-prose'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: { wrapper: ['mx-auto'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
