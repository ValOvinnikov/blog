import { tv } from '@platform/utils/tv/tv';

export const alertDialogShellVariants = tv({
  slots: {
    popup: [
      'fixed right-4 bottom-4 left-4 z-40 max-h-[calc(100dvh---spacing(8))] overflow-y-auto',
      'md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2',
      'flex flex-col gap-4 rounded-platform border border-platform-line bg-platform-surface p-6 shadow-platform-lg',
      'break-words',
      'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
      'transition-opacity duration-base ease-smooth',
    ],
    description: ['text-platform-13 text-platform-muted'],
    actions: [
      'flex flex-col-reverse gap-2 *:w-full',
      'md:flex-row md:flex-wrap md:justify-end md:*:w-auto',
    ],
  },
});
