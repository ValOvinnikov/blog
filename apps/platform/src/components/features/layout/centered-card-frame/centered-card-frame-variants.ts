import { tv } from '@platform/utils/tv/tv';

export const centeredCardFrameVariants = tv({
  slots: {
    root: ['min-h-dvh w-full bg-platform-bg text-platform-text'],
    main: [
      'mx-auto flex min-h-dvh w-full max-w-[472px] flex-col items-center justify-center gap-7 p-4',
    ],
    card: ['w-full'],
    body: ['px-9 pt-9 pb-8'],
  },
});
