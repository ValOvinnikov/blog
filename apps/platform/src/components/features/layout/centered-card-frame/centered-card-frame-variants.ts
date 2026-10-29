import { tv } from '@platform/utils/tv/tv';

export const centeredCardFrameVariants = tv({
  slots: {
    root: ['min-h-dvh w-full bg-admin-bg text-admin-text'],
    main: [
      'mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-6 p-4',
    ],
    brand: ['flex items-center gap-2'],
    brandName: ['text-admin-14 font-bold'],
    card: ['w-full'],
  },
});
