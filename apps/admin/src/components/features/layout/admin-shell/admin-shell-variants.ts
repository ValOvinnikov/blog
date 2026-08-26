import { tv } from 'tailwind-variants';

export const adminShellVariants = tv({
  slots: {
    root: ['flex min-h-dvh flex-col bg-admin-bg text-admin-text md:flex-row'],
    main: ['flex min-w-0 flex-1 flex-col'],
    content: ['mx-auto w-full max-w-[1180px] flex-1 p-4 md:p-[26px]'],
  },
});
