import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const settingRowVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-start justify-between',
      'gap-x-6 gap-y-3 py-3',
    ],
    content: ['min-w-0 flex-1'],
    title: [
      'flex flex-wrap items-center gap-2',
      'font-mono text-copy font-medium text-text',
    ],
    description: ['mt-1 font-body text-copy text-subtle'],
    control: ['flex flex-wrap items-center justify-end gap-2'],
  },
  variants: {
    tone: {
      default: {
        root: ['border-t border-dashed border-border first:border-t-0'],
        content: ['lg:max-w-md'],
        control: [
          'w-full flex-col items-stretch',
          'md:w-auto md:flex-row md:items-center',
        ],
      },
      danger: {
        root: [
          'rounded-sm border border-l-2 border-error',
          'bg-error-muted',
          'mt-2 px-3',
        ],
        title: ['text-error'],
        content: ['lg:max-w-md'],
        control: [
          'w-full flex-col items-stretch',
          'md:w-auto md:flex-row md:items-center',
          'ml-auto',
        ],
      },
    },
  },
  defaultVariants: { tone: 'default' },
});

export type TSettingRowVariants = VariantProps<typeof settingRowVariants>;
