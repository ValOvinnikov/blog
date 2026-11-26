import { tv } from '@shinefold/ui/lib/styling';

export const sidebarNavBackLinkVariants = tv({
  slots: {
    link: [
      'mb-4 flex w-fit items-center gap-1.5 rounded-md',
      'font-mono text-caption text-subtle no-underline',
      'transition-colors duration-base ease-smooth',
      'hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
    ],
    arrow: ['size-3.5 shrink-0 rotate-180'],
  },
});
