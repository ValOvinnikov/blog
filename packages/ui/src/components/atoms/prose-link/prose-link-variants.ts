import { tv } from '@blog/ui/lib/styling';

export const proseLinkVariants = tv({
  base: [
    'text-brand-primary underline decoration-border-strong underline-offset-2',
    'transition-colors duration-base ease-smooth hover:text-brand-primary-hover',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
  ],
});
