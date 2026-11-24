import { TEXT_ROLE } from '@shinefold/config';
import {
  CARD_CONTAINER,
  INTERACTIVE_ITEM_CARD,
  tv,
  TYPOGRAPHY,
} from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const taxonomyCardVariants = tv({
  slots: {
    root: [
      CARD_CONTAINER,
      'relative isolate flex h-full flex-col gap-2',
      'item-card surface-card',
      'px-card-x py-card-y',
    ],
    accessibleName: ['sr-only'],
    description: [TYPOGRAPHY[TEXT_ROLE.CARD_BODY], 'line-clamp-2'],
    count: [TYPOGRAPHY[TEXT_ROLE.META], 'mt-auto'],
  },
  variants: {
    isInteractive: {
      true: {
        root: [
          INTERACTIVE_ITEM_CARD,
          'focus-within:surface-tint',
          'has-[li:hover]:bg-surface',
        ],
      },
      false: {},
    },
  },
  defaultVariants: {
    isInteractive: false,
  },
});

export type TTaxonomyCardVariants = VariantProps<typeof taxonomyCardVariants>;
