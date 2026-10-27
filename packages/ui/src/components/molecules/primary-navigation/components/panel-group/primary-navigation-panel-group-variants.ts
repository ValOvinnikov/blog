import { PANEL_LINK } from '@blog/ui/components/molecules/primary-navigation/primary-navigation-variants';
import { FOCUS_RING, TRANSITION_COLORS, tv } from '@blog/ui/lib/styling';

export const primaryNavigationPanelGroupVariants = tv({
  slots: {
    root: ['group w-full'],
    summary: [
      ...PANEL_LINK,
      'cursor-pointer list-none justify-between',
      'font-mono text-meta text-muted',
      'hover:text-text group-open:bg-surface-2',
      '[&::-webkit-details-marker]:hidden',
      TRANSITION_COLORS,
      FOCUS_RING,
    ],
    chevron: ['transition-transform group-open:rotate-180'],
    items: ['flex flex-col gap-1 pt-1'],
    link: [...PANEL_LINK, 'pl-7'],
  },
  variants: {
    isActive: {
      true: { summary: ['font-semibold text-brand-primary'] },
    },
    isLead: {
      true: { link: ['justify-between font-semibold'] },
    },
  },
});
