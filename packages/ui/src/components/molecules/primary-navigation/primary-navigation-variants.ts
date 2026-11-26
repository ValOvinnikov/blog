import { HEADER_LAYOUT } from '@shinefold/config';
import { MENU_ROW, tv } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const PANEL_LINK = [
  'flex min-h-11 w-full items-center px-3 py-2',
  ...MENU_ROW,
];

export const primaryNavigationVariants = tv({
  slots: {
    // No `relative` here on purpose: the phone menu's `absolute inset-x-0` takes `Header`'s bar as its containing block, so it spans the bar's width.
    root: ['flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 lg:gap-x-6'],
    links: ['flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'],
  },
  variants: {
    collapsible: {
      true: {
        links: ['hidden lg:flex'],
      },
    },
    layout: {
      [HEADER_LAYOUT.CLASSIC]: { root: ['justify-end'] },
      [HEADER_LAYOUT.LINKS_BESIDE_BRAND]: {
        root: ['justify-end lg:contents'],
        links: ['lg:gap-x-6'],
      },
      [HEADER_LAYOUT.CENTRED_LINKS]: {
        root: ['justify-end lg:contents'],
        links: ['lg:gap-x-6'],
      },
      [HEADER_LAYOUT.TWO_ROWS]: {
        root: ['justify-end lg:contents'],
        links: [
          'lg:col-span-full lg:row-start-2 lg:gap-x-7',
          'lg:border-t lg:border-border lg:pt-3',
        ],
      },
      [HEADER_LAYOUT.CENTRED_BRAND]: {
        root: ['justify-end lg:contents'],
        links: ['lg:col-start-1 lg:row-start-1 lg:gap-x-6'],
      },
      [HEADER_LAYOUT.MENU_BUTTON]: { root: ['justify-end'] },
    },
  },
  compoundVariants: [
    {
      collapsible: true,
      layout: HEADER_LAYOUT.MENU_BUTTON,
      class: { links: ['lg:hidden'] },
    },
  ],
  defaultVariants: {
    layout: HEADER_LAYOUT.CLASSIC,
  },
});

export type TPrimaryNavigationVariants = VariantProps<
  typeof primaryNavigationVariants
>;
