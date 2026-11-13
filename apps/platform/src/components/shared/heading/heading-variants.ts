import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['text-platform-text', 'm-0', 'font-platform', 'tracking-normal'],
  variants: {
    size: {
      pageTitle: [
        'text-platform-22',
        'leading-7',
        'md:text-platform-24',
        'md:leading-8',
        'font-semibold',
        'tracking-[-0.01em]',
        'wrap-anywhere',
      ],
      previewTitle: ['text-platform-15', 'leading-5', 'font-platform-650'],
      cardTitle: [
        'text-platform-14',
        'leading-5',
        'font-semibold',
        'wrap-anywhere',
      ],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
