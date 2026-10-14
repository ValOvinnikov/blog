import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const detailListVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 items-baseline gap-x-3.5 gap-y-1',
      'md:grid-cols-[132px_1fr] md:gap-y-2.5',
      'text-admin-13-5',
    ],
    term: ['text-admin-12-5 text-admin-muted max-md:not-first:mt-2'],
    description: ['m-0 flex min-w-0 flex-wrap items-center gap-2'],
    value: ['min-w-0 overflow-hidden text-ellipsis max-md:wrap-anywhere'],
  },
  variants: {
    isMono: {
      true: { value: ['font-mono text-admin-12-5'] },
      false: {},
    },
  },
  defaultVariants: {
    isMono: false,
  },
});

export type TDetailListVariants = VariantProps<typeof detailListVariants>;
