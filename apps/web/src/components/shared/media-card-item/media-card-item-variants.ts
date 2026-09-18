import { tv } from 'tailwind-variants';

export const mediaCardItemVariants = tv({
  slots: {
    titleLink: ['before:absolute before:inset-0'],
  },
});
