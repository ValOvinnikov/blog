import { HEADER_BAR_STYLE, HEADER_LAYOUT } from '@blog/config';
import { HEADER_ANCHOR, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const headerVariants = tv({
  slots: {
    root: ['w-full', 'sticky top-0 z-10'],
    inner: [
      'flex flex-wrap items-center justify-between gap-x-5 gap-y-3',
      'mx-auto w-full max-w-page px-gutter py-3',
    ],
    navActionsGroup: ['flex min-w-0 flex-wrap items-center gap-4'],
  },
  variants: {
    layout: {
      [HEADER_LAYOUT.CLASSIC]: {},
      [HEADER_LAYOUT.LINKS_BESIDE_BRAND]: {
        inner: ['lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-x-10'],
      },
      [HEADER_LAYOUT.CENTRED_LINKS]: {
        inner: ['lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6'],
      },
      [HEADER_LAYOUT.TWO_ROWS]: {
        inner: ['lg:grid lg:grid-cols-[1fr_auto] lg:gap-x-6'],
      },
      [HEADER_LAYOUT.CENTRED_BRAND]: {
        inner: ['lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6'],
      },
      [HEADER_LAYOUT.MENU_BUTTON]: {},
    },
    barStyle: {
      [HEADER_BAR_STYLE.FULL_WIDTH]: {
        root: ['bg-primary border-b border-border', HEADER_ANCHOR],
      },
      [HEADER_BAR_STYLE.FLOATING]: {
        root: ['px-3 pt-3'],
        inner: [
          'relative',
          'rounded-card border border-border bg-primary shadow-float',
          HEADER_ANCHOR,
        ],
      },
    },
  },
  defaultVariants: {
    layout: HEADER_LAYOUT.CLASSIC,
    barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  },
});

export type THeaderVariants = VariantProps<typeof headerVariants>;
