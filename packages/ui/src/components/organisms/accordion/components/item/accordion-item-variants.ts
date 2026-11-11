import { tv } from '@blog/ui/lib/styling';

export const accordionItemVariants = tv({
  base: [
    'item-card surface-card px-card-x',
    'not-first:border-t-[length:max(var(--item-border-width),var(--item-divider-width))]',
  ],
});
