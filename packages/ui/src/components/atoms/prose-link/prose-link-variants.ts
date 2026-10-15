import { LINK_UNDERLINE, tv } from '@blog/ui/lib/styling';

export const proseLinkVariants = tv({
  base: [
    ...LINK_UNDERLINE,
    'text-brand-primary decoration-border-strong',
    'transition-colors duration-base ease-smooth',
    'hover:text-brand-primary-hover hover:decoration-current',
    'rounded-sm',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
  ],
});
