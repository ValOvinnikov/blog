import { HEADER_BAR_STYLE, HEADER_LAYOUT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const PANEL_LINK = [
  'flex min-h-11 w-full items-center',
  'rounded-md px-3 py-2',
  'hover:bg-surface-2',
];

export const primaryNavigationVariants = tv({
  slots: {
    // No `relative` here on purpose: `panel`'s `absolute inset-x-0` deliberately relies on `Header`'s own `sticky` element as its containing block.
    root: ['flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 lg:gap-x-6'],
    links: ['flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'],
    controls: ['flex shrink-0 items-center gap-x-2 lg:gap-x-6'],
    toggle: ['shrink-0'],
    panel: [
      'absolute inset-x-0 top-full z-20',
      'flex flex-col items-start gap-1 p-4',
      'bg-primary border-b border-border shadow-lg',
    ],
    panelLink: PANEL_LINK,
    barPanelActions: ['flex shrink-0 items-center gap-x-2'],
    panelActionsRow: [
      'flex w-full items-center gap-3',
      'mt-2 border-t border-border px-3 pt-3',
    ],
    drawerActionsRow: ['w-full', 'mt-2 border-t border-border pt-3'],
  },
  variants: {
    collapsible: {
      true: {
        links: ['hidden lg:flex'],
        toggle: ['lg:hidden'],
        panel: ['lg:hidden'],
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
    barStyle: {
      [HEADER_BAR_STYLE.FULL_WIDTH]: {},
      [HEADER_BAR_STYLE.FLOATING]: {
        panel: [
          'inset-x-3 mt-2',
          'rounded-card border border-border shadow-float',
        ],
      },
    },
  },
  compoundVariants: [
    {
      collapsible: true,
      layout: HEADER_LAYOUT.MENU_BUTTON,
      class: {
        links: ['lg:hidden'],
        toggle: ['lg:inline-grid'],
        panel: ['lg:flex'],
        panelActionsRow: ['lg:hidden'],
        drawerActionsRow: ['lg:hidden'],
      },
    },
  ],
  defaultVariants: {
    layout: HEADER_LAYOUT.CLASSIC,
    barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  },
});

export type TPrimaryNavigationVariants = VariantProps<
  typeof primaryNavigationVariants
>;
