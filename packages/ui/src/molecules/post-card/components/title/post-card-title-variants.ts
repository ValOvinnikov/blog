import { tv } from 'tailwind-variants';

export const postCardTitleVariants = tv({
  base: [
    'font-display font-medium',
    'tracking-[-0.01em] leading-[1.2]',
    'text-text hover:text-accent transition-colors',
  ],
});
