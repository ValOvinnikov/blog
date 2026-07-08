import { tv } from 'tailwind-variants';

export const themeToggleVariants = tv({
  base: [
    'inline-flex size-[22px] items-center justify-center',
    'rounded-sm',
    'text-muted',
    'transition-colors duration-fast ease-console',
    'hover:text-text',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
});

export const themeTogglePlaceholderVariants = tv({
  base: ['block h-[18px] w-[18px]'],
});
