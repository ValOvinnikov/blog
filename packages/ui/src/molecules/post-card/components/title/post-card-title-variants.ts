import { tv } from 'tailwind-variants';

export const postCardTitleVariants = tv({
  slots: {
    link: [
      'focus:outline-none',
      'focus-visible:ring-2 focus-visible:ring-accent rounded',
    ],
    title: [
      'font-display font-bold leading-tight tracking-tight',
      'text-fg hover:text-accent transition-colors',
    ],
  },
});
