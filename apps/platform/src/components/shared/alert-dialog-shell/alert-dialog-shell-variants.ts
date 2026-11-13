import { tv } from '@platform/utils/tv/tv';

export const alertDialogShellVariants = tv({
  slots: {
    popup: [
      'fixed top-1/2 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
      'flex flex-col gap-4 rounded-platform border border-platform-line bg-platform-surface p-6 shadow-platform-lg',
      'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
      'transition-opacity duration-base ease-smooth',
    ],
    description: ['text-platform-13 text-platform-muted'],
    actions: ['flex flex-wrap justify-end gap-2'],
  },
});
