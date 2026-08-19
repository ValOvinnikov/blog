import { Size } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const iconVariants = tv({
  base: ['shrink-0'],
  variants: {
    size: {
      [Size.SM]: ['size-4'],
      [Size.MD]: ['size-4.5'],
      [Size.LG]: ['size-6'],
    },
    variant: {
      chevronDown: ['rotate-90 text-text-subtle'],
      chevronOpen: [
        'text-text-subtle transition-transform duration-base ease-console group-open:rotate-90',
      ],
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});

export type TIconVariants = VariantProps<typeof iconVariants>;
