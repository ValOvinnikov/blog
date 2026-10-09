import { tv } from '@platform/utils/tv/tv';

export const preShellFrameVariants = tv({
  slots: {
    root: ['min-h-dvh w-full bg-admin-bg text-admin-text'],
    main: [
      'mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center p-4',
    ],
    card: ['overflow-clip'],
    headerGutter: ['px-[18px]'],
  },
});
