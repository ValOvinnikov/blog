import { tv } from '@admin/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['text-admin-text', 'm-0'],
  variants: {
    size: {
      pageTitle: ['text-[22px]', 'font-bold', 'tracking-[-0.01em]'],
      cardTitle: ['text-[15px]', '[font-weight:650]'],
      fieldLabel: ['text-[13px]', 'font-semibold'],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
