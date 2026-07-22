import { tv } from '@blog/ui/lib/styling';

export const proseLinkVariants = tv({
  base: [
    'text-accent underline decoration-border-strong underline-offset-2',
    'transition-colors duration-base ease-console hover:text-accent-hover',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
});
