import { tv } from '@platform/utils/tv/tv';

export const deadEndViewVariants = tv({
  slots: {
    root: ['min-h-dvh w-full bg-admin-bg text-admin-text'],
    main: [
      'mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-6 p-4',
    ],
    brand: ['flex items-center gap-2'],
    brandName: ['text-admin-14 font-bold'],
    card: ['w-full'],
    content: ['flex flex-col items-start gap-4'],
    copy: ['flex flex-col gap-2'],
    actions: ['flex flex-wrap items-center gap-2'],
    errorId: ['self-stretch border-t border-admin-line-2 pt-3 font-mono'],
  },
});
