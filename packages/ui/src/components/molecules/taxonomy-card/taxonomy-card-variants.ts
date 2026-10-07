import { INTERACTIVE_ITEM_CARD, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const taxonomyCardVariants = tv({
  slots: {
    root: [
      'relative flex h-full flex-col gap-2',
      'item-card surface-card',
      'px-card-x py-card-y',
    ],
    accessibleName: ['sr-only'],
    description: ['text-prose leading-[1.55]', 'text-muted line-clamp-2'],
    count: ['font-mono text-label', 'text-subtle'],
  },
  variants: {
    isInteractive: {
      true: {
        root: [INTERACTIVE_ITEM_CARD, 'focus-within:surface-brand-primary'],
      },
      false: {},
    },
  },
  defaultVariants: {
    isInteractive: true,
  },
});

export type TTaxonomyCardVariants = VariantProps<typeof taxonomyCardVariants>;
