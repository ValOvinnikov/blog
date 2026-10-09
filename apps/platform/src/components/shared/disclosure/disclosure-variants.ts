import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const disclosureVariants = tv({
  slots: {
    root: [],
    trigger: ['group/trigger flex cursor-pointer items-center text-left'],
    chevron: [
      'shrink-0 transition-transform group-data-[panel-open]/trigger:rotate-90',
    ],
    inner: [],
  },
  variants: {
    variant: {
      card: {
        root: [
          'overflow-hidden rounded-admin border border-admin-line shadow-admin',
        ],
        trigger: [
          'w-full gap-2.5 bg-admin-surface px-[18px] py-[14px] text-sm font-semibold text-admin-text',
        ],
        chevron: ['ml-auto text-admin-faint'],
        inner: ['border-t border-admin-line-2 p-[18px]'],
      },
      inline: {
        trigger: [
          'gap-1 text-[13px] font-medium text-admin-text',
          'underline-offset-2 hover:underline',
        ],
        chevron: ['order-first text-admin-text'],
      },
    },
  },
  defaultVariants: {
    variant: 'card',
  },
});

export type TDisclosureVariants = VariantProps<typeof disclosureVariants>;
