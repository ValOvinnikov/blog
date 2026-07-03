import { tv } from 'tailwind-variants';

export const themeToggleVariants = tv({
  base: [
    'inline-flex h-9 w-9 items-center justify-center',
    'rounded-sm',
    'text-text-muted',
    'transition-colors duration-[var(--dur-fast)]',
    'hover:bg-surface-2 hover:text-text',
  ],
});

export const themeTogglePlaceholderVariants = tv({
  base: ['block h-[18px] w-[18px]'],
});
