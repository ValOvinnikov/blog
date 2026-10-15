import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const pricingModuleViewVariants = tv({
  slots: {
    footnote: ['mt-5 max-w-measure'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { footnote: ['text-left'] },
      [CONTENT_ALIGNMENT.CENTER]: { footnote: ['mx-auto text-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { footnote: ['ml-auto text-right'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
