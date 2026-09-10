import { tv } from 'tailwind-variants';

export const postCardItemVariants = tv({
  slots: {
    titleLink: ['before:absolute before:inset-0'],
  },
});
