import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['text-admin-text', 'm-0', 'font-admin', 'tracking-normal'],
  variants: {
    size: {
      pageTitle: ['text-[24px]', 'font-semibold', 'tracking-[-0.01em]'],
      cardTitle: ['text-[15px]', '[font-weight:650]'],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
