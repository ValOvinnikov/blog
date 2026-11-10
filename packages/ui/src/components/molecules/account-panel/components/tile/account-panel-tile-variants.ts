import { tv } from '@blog/ui/lib/styling';

export const accountPanelTileVariants = tv({
  slots: {
    icon: ['text-brand-primary'],
    title: ['font-semibold in-aria-[current=page]:font-bold'],
    description: ['font-mono text-meta text-muted'],
  },
});
