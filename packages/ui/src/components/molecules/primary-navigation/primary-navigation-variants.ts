import { HEADER_LAYOUT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const PANEL_LINK = [
  'flex min-h-11 w-full items-center',
  'rounded-md px-3 py-2',
  'hover:bg-surface-2',
];

export const primaryNavigationVariants = tv({
  slots: {
    // No `relative` here on purpose: the phone menu's `absolute inset-x-0` takes `Header`'s bar as its containing block, so it spans the bar's width.
    root: ['flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 lg:gap-x-6'],
    links: ['flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'],
    controls: ['flex shrink-0 items-center gap-x-2 lg:gap-x-6'],
    toggle: ['shrink-0'],
    barPanelActions: ['flex shrink-0 items-center gap-x-2'],
  },
  variants: {
    collapsible: {
      true: {
        links: ['hidden lg:flex'],
        toggle: ['lg:hidden'],
        barPanelActions: ['hidden lg:flex'],
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
        controls: ['lg:justify-self-end'],
      },
      [HEADER_LAYOUT.TWO_ROWS]: {
        root: ['justify-end lg:contents'],
        links: [
          'lg:col-span-full lg:row-start-2 lg:gap-x-7',
          'lg:border-t lg:border-border lg:pt-3',
        ],
        controls: ['lg:justify-self-end'],
      },
      [HEADER_LAYOUT.CENTRED_BRAND]: {
        root: ['justify-end lg:contents'],
        links: ['lg:col-start-1 lg:row-start-1 lg:gap-x-6'],
        controls: ['lg:col-start-3 lg:row-start-1 lg:justify-self-end'],
      },
      [HEADER_LAYOUT.MENU_BUTTON]: { root: ['justify-end'] },
    },
  },
  compoundVariants: [
    {
      collapsible: true,
      layout: HEADER_LAYOUT.MENU_BUTTON,
      class: {
        links: ['lg:hidden'],
        toggle: ['lg:inline-grid'],
      },
    },
  ],
  defaultVariants: {
    layout: HEADER_LAYOUT.CLASSIC,
  },
});

export type TPrimaryNavigationVariants = VariantProps<
  typeof primaryNavigationVariants
>;
