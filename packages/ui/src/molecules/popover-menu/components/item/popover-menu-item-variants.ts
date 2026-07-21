import { tv } from '@blog/ui/lib/styling';

export const popoverMenuItemVariants = tv({
  base: [
    'flex w-full items-center gap-2',
    'rounded-full px-3 py-2',
    'font-display text-sm text-text',
    'transition-colors duration-base ease-console',
    'hover:bg-surface-2 hover:text-accent',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  ],
});
