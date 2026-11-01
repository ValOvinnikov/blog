import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['text-admin-text', 'm-0', 'font-admin', 'tracking-normal'],
  variants: {
    size: {
      pageTitle: [
        'text-admin-22',
        'leading-7',
        'md:text-admin-24',
        'md:leading-8',
        'font-semibold',
        'tracking-[-0.01em]',
        'wrap-anywhere',
      ],
      cardTitle: [
        'text-admin-14',
        'leading-5',
        'font-semibold',
        'wrap-anywhere',
      ],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
