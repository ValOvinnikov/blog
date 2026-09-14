import { tv } from 'tailwind-variants';

export const localeLayoutVariants = tv({
  slots: {
    root: ['flex min-h-dvh flex-col'],
    // Flex container, not just a flex item — a child fills it with its own `flex-1`.
    content: ['flex flex-1 flex-col'],
  },
});
