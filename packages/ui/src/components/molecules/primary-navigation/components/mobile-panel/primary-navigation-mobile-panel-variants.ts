import { HEADER_LAYOUT } from '@blog/config';
import { PANEL_LINK } from '@blog/ui/components/molecules/primary-navigation/primary-navigation-variants';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const primaryNavigationMobilePanelVariants = tv({
  slots: {
    panel: [
      'absolute inset-x-0 top-full z-20',
      'flex flex-col items-start gap-1 p-4',
      'bg-primary border-b border-border shadow-lg',
      'lg:hidden',
    ],
    link: PANEL_LINK,
    panelActionsRow: [
      'flex w-full items-center gap-3',
      'mt-2 border-t border-border px-3 pt-3',
    ],
    drawerActionsRow: ['w-full', 'mt-2 border-t border-border pt-3'],
  },
  variants: {
    layout: {
      [HEADER_LAYOUT.CLASSIC]: {},
      [HEADER_LAYOUT.LINKS_BESIDE_BRAND]: {},
      [HEADER_LAYOUT.CENTRED_LINKS]: {},
      [HEADER_LAYOUT.TWO_ROWS]: {},
      [HEADER_LAYOUT.CENTRED_BRAND]: {},
      [HEADER_LAYOUT.MENU_BUTTON]: {
        panel: ['lg:flex'],
        panelActionsRow: ['lg:hidden'],
        drawerActionsRow: ['lg:hidden'],
      },
    },
  },
});

export type TPrimaryNavigationMobilePanelVariants = VariantProps<
  typeof primaryNavigationMobilePanelVariants
>;
