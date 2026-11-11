import { tv } from '@blog/ui/lib/styling';

export const accordionItemVariants = tv({
  base: [
    'item-card surface-card px-card-x',
    '[--radius-item:var(--item-stack-radius)]',
    'first:border-t-[length:max(var(--item-border-width),var(--item-divider-width))]',
    'not-first:border-t-[length:max(var(--item-border-width),var(--item-divider-width))]',
    'last:border-b-[length:max(var(--item-border-width),var(--item-divider-width))]',
  ],
});
