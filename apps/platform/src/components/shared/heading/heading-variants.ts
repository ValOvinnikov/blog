import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['text-admin-text', 'm-0', 'font-admin', 'tracking-normal'],
  variants: {
    size: {
      pageTitle: ['text-admin-24', 'font-semibold', 'tracking-[-0.01em]'],
      cardTitle: ['text-admin-15', '[font-weight:650]'],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
