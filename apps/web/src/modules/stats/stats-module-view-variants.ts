import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const statsModuleViewVariants = tv({
  slots: {
    grid: ['grid grid-cols-2 divide-x divide-border'],
    item: [
      'flex flex-col gap-1',
      'px-4 first:pl-0 last:pr-0 sm:px-5 sm:first:pl-0 sm:last:pr-0',
    ],
    value: [
      'order-1',
      'text-[clamp(38px,7vw,56px)] font-bold tracking-tight tabular-nums text-brand-primary',
    ],
    label: ['order-2', 'text-sm text-text-muted'],
    description: ['order-3', 'text-sm text-text-muted'],
  },
  variants: {
    columns: {
      1: { grid: ['lg:grid-cols-1'] },
      2: { grid: ['lg:grid-cols-2'] },
      3: { grid: ['lg:grid-cols-3'] },
      4: { grid: ['lg:grid-cols-4'] },
    },
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { item: ['items-start text-left'] },
      [CONTENT_ALIGNMENT.CENTER]: { item: ['items-center text-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { item: ['items-end text-right'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
