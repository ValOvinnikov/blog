import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const detailListVariants = tv({
  slots: {
    root: [
      'grid grid-cols-[132px_1fr] items-baseline gap-x-3.5 gap-y-2.5',
      'text-[13.5px]',
    ],
    term: ['text-[12.5px] text-admin-muted'],
    description: ['m-0 flex min-w-0 flex-wrap items-center gap-2'],
    value: ['min-w-0 overflow-hidden text-ellipsis'],
  },
  variants: {
    isMono: {
      true: { value: ['font-mono text-[12.5px]'] },
      false: {},
    },
  },
  defaultVariants: {
    isMono: false,
  },
});

export type TDetailListVariants = VariantProps<typeof detailListVariants>;
