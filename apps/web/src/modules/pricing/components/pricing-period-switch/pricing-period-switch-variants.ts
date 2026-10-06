import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const pricingPeriodSwitchVariants = tv({
  slots: {
    control: ['mb-6 flex'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { control: ['justify-start'] },
      [CONTENT_ALIGNMENT.CENTER]: { control: ['justify-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { control: ['justify-end'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
