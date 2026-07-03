import { cva } from 'class-variance-authority';

export const themeToggleVariants = cva([
  'inline-flex h-9 w-9 items-center justify-center',
  'rounded-sm',
  'text-text-muted',
  'transition-colors duration-[var(--dur-fast)]',
  'hover:bg-surface-2 hover:text-text',
]);

export const themeTogglePlaceholderVariants = cva(['block h-[18px] w-[18px]']);
