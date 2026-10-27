import { ACCOUNT_PANEL_STYLE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const accountPanelVariants = tv({
  slots: {
    panel: ['gap-0'],
    links: ['flex flex-col'],
    footer: [],
    signOut: [],
  },
  variants: {
    appearance: {
      [ACCOUNT_PANEL_STYLE.CARD]: { panel: ['p-2'] },
      [ACCOUNT_PANEL_STYLE.PROFILE]: {
        panel: ['overflow-hidden p-0'],
        links: ['p-2'],
        footer: ['px-4 pb-4'],
        signOut: ['w-full'],
      },
      [ACCOUNT_PANEL_STYLE.HUB]: {
        panel: ['gap-3.5'],
        links: ['grid grid-cols-2 gap-2'],
        footer: ['flex justify-end', 'border-t border-border pt-3'],
        signOut: ['w-auto min-h-8 px-2.5 py-1.5'],
      },
    },
  },
});

export type TAccountPanelVariants = VariantProps<typeof accountPanelVariants>;
