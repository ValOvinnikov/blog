import { tv } from 'tailwind-variants';

export const localeLayoutVariants = tv({
  slots: {
    root: ['flex min-h-dvh flex-col'],
    content: ['flex-1'],
  },
});
