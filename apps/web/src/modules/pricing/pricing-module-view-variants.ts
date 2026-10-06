import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const pricingModuleViewVariants = tv({
  slots: {
    grid: ['grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8'],
    footnote: ['mt-5 max-w-measure'],
  },
  variants: {
    count: {
      1: { grid: ['mx-auto w-full max-w-sm'] },
      2: { grid: ['md:grid-cols-2'] },
      3: { grid: ['lg:grid-cols-3'] },
      4: { grid: ['md:grid-cols-2 lg:grid-cols-4'] },
    },
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { footnote: ['text-left'] },
      [CONTENT_ALIGNMENT.CENTER]: { footnote: ['mx-auto text-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { footnote: ['ml-auto text-right'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
