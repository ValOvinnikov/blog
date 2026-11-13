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
          'overflow-hidden rounded-platform border border-platform-line shadow-platform',
        ],
        trigger: [
          'w-full gap-2.5 bg-platform-surface px-[18px] py-[14px] text-platform-13-5 font-semibold text-platform-text',
        ],
        chevron: ['ml-auto text-platform-faint'],
        inner: ['border-t border-platform-line-2 p-[18px]'],
      },
      inline: {
        trigger: [
          'gap-1 text-platform-13 font-medium text-platform-text',
          'underline-offset-2 hover:underline',
        ],
        chevron: ['order-first text-platform-text'],
      },
      section: {
        trigger: [
          'min-h-11 w-full gap-3 rounded-platform bg-transparent py-1.5 pr-2 pl-1 text-platform-text',
          focusRingClasses(FOCUS_RING_GROUND.BG),
        ],
        chevron: [
          'order-first text-platform-muted duration-150 motion-reduce:transition-none',
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
