import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const statsModuleViewVariants = tv({
  slots: {
    grid: ['grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2'],
    item: ['flex flex-col gap-1', 'border-divider'],
    value: [
      'order-1',
      'text-3xl sm:text-4xl lg:text-display',
      'font-bold tracking-tight tabular-nums text-brand-primary',
    ],
    label: ['order-2', 'text-sm font-medium text-text'],
    description: ['order-3', 'text-sm text-text'],
    footnote: ['mt-5 max-w-measure'],
  },
  variants: {
    columns: {
      1: { grid: ['lg:grid-cols-1'] },
      2: { grid: ['lg:grid-cols-2'] },
      3: { grid: ['lg:grid-cols-3'] },
      4: { grid: ['lg:grid-cols-4'] },
    },
    hasDividerBelowLg: {
      true: { item: ['sm:max-lg:border-l sm:max-lg:pl-5'] },
    },
    hasDividerFromLg: {
      true: { item: ['lg:border-l lg:pl-5'] },
    },
    isLoneBelowLg: {
      true: { item: ['sm:max-lg:col-span-2 sm:max-lg:justify-self-center'] },
    },
    isLoneFromLg: {
      true: { item: ['lg:col-span-full lg:justify-self-center'] },
    },
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        item: ['items-start text-left'],
        footnote: ['text-left'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        item: ['items-center text-center'],
        footnote: ['mx-auto text-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        item: ['items-end text-right'],
        footnote: ['ml-auto text-right'],
      },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
