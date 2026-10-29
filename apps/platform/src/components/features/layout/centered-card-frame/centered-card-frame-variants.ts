import { tv } from '@platform/utils/tv/tv';

export const centeredCardFrameVariants = tv({
  slots: {
    root: ['min-h-dvh w-full bg-admin-bg text-admin-text'],
    main: [
      'mx-auto flex min-h-dvh w-full max-w-[472px] flex-col items-center justify-center gap-7 p-4',
    ],
    brand: ['flex items-center gap-2.5'],
    brandName: ['text-admin-20 font-bold tracking-[0.2px]'],
    card: ['w-full'],
    body: ['px-9 pt-9 pb-8'],
  },
});
