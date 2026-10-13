import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const cardListVariants = tv({
  slots: {
    list: ['flex flex-col'],
    row: ['flex gap-3 py-2.5', 'border-b border-admin-line-2 last:border-b-0'],
    body: ['min-w-0 flex-1'],
    primary: ['block text-admin-13 text-admin-text'],
    secondary: ['block text-admin-12 text-admin-muted'],
    time: ['flex-none text-admin-12 text-admin-muted'],
  },
  variants: {
    align: {
      start: {
        row: ['items-start'],
        body: ['flex flex-col gap-1'],
        time: ['pt-0.5'],
      },
      center: {
        row: ['items-center'],
      },
    },
  },
  defaultVariants: {
    align: 'center',
  },
});

export type TCardListVariants = VariantProps<typeof cardListVariants>;
