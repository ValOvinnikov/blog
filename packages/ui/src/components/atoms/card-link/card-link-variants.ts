import { tv } from '@blog/ui/lib/styling';

export const cardLinkVariants = tv({
  base: [
    'before:absolute before:inset-0 before:rounded-item',
    // Important, or the unlayered forced-colours rule redraws the ring around the clamped title.
    'focus-visible:outline-none!',
    'focus-visible:before:outline-2 focus-visible:before:-outline-offset-2',
    'focus-visible:before:outline-(--ring)',
    'forced-colors:focus-visible:before:outline-[Highlight]',
  ],
});
