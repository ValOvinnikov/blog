import { HEADER_LAYOUT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const primaryNavigationControlsVariants = tv({
  slots: {
    controls: ['flex shrink-0 items-center gap-x-2 lg:gap-x-6'],
    toggle: ['shrink-0'],
    barPanelActions: ['flex shrink-0 items-center gap-x-2'],
    barAction: [],
  },
  variants: {
    collapsible: {
      true: {
        toggle: ['lg:hidden'],
        barPanelActions: ['hidden lg:flex'],
      },
    },
    hasActionInMenu: {
      true: {},
      false: {},
    },
    layout: {
      [HEADER_LAYOUT.CLASSIC]: {},
      [HEADER_LAYOUT.LINKS_BESIDE_BRAND]: {},
      [HEADER_LAYOUT.CENTRED_LINKS]: { controls: ['lg:justify-self-end'] },
      [HEADER_LAYOUT.TWO_ROWS]: { controls: ['lg:justify-self-end'] },
      [HEADER_LAYOUT.CENTRED_BRAND]: {
        controls: ['lg:col-start-3 lg:row-start-1 lg:justify-self-end'],
      },
      [HEADER_LAYOUT.MENU_BUTTON]: {},
    },
  },
  compoundVariants: [
    {
      collapsible: true,
      hasActionInMenu: true,
      class: { barAction: ['hidden lg:inline-flex'] },
    },
    {
      collapsible: true,
      layout: HEADER_LAYOUT.MENU_BUTTON,
      class: { toggle: ['lg:inline-grid'] },
    },
  ],
  defaultVariants: {
    layout: HEADER_LAYOUT.CLASSIC,
  },
});

export type TPrimaryNavigationControlsVariants = VariantProps<
  typeof primaryNavigationControlsVariants
>;
