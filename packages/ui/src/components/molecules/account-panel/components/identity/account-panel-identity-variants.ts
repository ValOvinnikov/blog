import { ACCOUNT_PANEL_STYLE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const accountPanelIdentityVariants = tv({
  slots: {
    root: ['flex items-center gap-3'],
    avatar: [],
    text: ['min-w-0'],
    name: ['truncate', 'font-display text-copy font-semibold text-text'],
    email: ['truncate', 'font-mono text-meta text-muted'],
  },
  variants: {
    appearance: {
      [ACCOUNT_PANEL_STYLE.CARD]: { root: ['px-3 pt-2.5 pb-3'] },
      [ACCOUNT_PANEL_STYLE.PROFILE]: {
        root: [
          'flex-col gap-2 px-4 pt-5 pb-4 text-center',
          'border-b border-border bg-surface-2 surface-nested',
        ],
        avatar: ['bg-surface'],
        text: ['max-w-full'],
      },
      [ACCOUNT_PANEL_STYLE.HUB]: {},
    },
  },
});
