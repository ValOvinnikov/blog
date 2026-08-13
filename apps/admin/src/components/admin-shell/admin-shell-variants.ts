import { tv } from 'tailwind-variants';

export const adminShellVariants = tv({
  slots: {
    root: ['flex min-h-dvh flex-col bg-primary text-text md:flex-row'],
    main: ['flex min-w-0 flex-1 flex-col'],
    content: ['flex-1 p-4 md:p-6'],
  },
});
