import { tv } from '@blog/ui/lib/styling';

export const sectionPagesModuleViewVariants = tv({
  slots: {
    card: [],
    image: ['size-full object-cover'],
  },
  variants: {
    hasImage: {
      // Roughly a title plus two summary lines, so a title-only card keeps a card's shape.
      false: { card: ['min-h-28'] },
      true: {},
    },
  },
});
