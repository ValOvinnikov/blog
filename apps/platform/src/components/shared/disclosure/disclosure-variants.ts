import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { ICON_SIZE } from '@platform/constants/icon';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
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
          'w-full gap-2.5 bg-admin-surface px-[18px] py-[14px] text-admin-13-5 font-semibold text-admin-text',
        ],
        chevron: ['ml-auto text-admin-faint'],
        inner: ['border-t border-admin-line-2 p-[18px]'],
      },
      inline: {
        trigger: [
          'gap-1 text-admin-13 font-medium text-admin-text',
          'underline-offset-2 hover:underline',
        ],
        chevron: ['order-first text-admin-text'],
      },
      section: {
        trigger: [
          'min-h-11 w-full gap-3 rounded-admin bg-transparent py-1.5 pr-2 pl-1 text-admin-text',
          focusRingClasses(FOCUS_RING_GROUND.BG),
        ],
        chevron: [
          'order-first text-admin-muted duration-150 motion-reduce:transition-none',
        ],
      },
    },
  },
  defaultVariants: {
    variant: 'card',
  },
});

export type TDisclosureVariants = VariantProps<typeof disclosureVariants>;

type TDisclosureVariant = NonNullable<TDisclosureVariants['variant']>;

export const DISCLOSURE_CHEVRON_SIZE = {
  card: ICON_SIZE.XL,
  inline: ICON_SIZE.XL,
  section: ICON_SIZE.MD,
} as const satisfies Record<TDisclosureVariant, string>;
