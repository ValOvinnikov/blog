import { tv } from '@platform/utils/tv/tv';

export const signInAppsFreeCardVariants = tv({
  slots: {
    list: ['divide-y divide-platform-line-2'],
    row: [
      'flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-platform-card py-3',
    ],
    name: [
      'flex min-w-0 flex-1 flex-col gap-0.5 font-semibold text-platform-text',
    ],
    badges: ['flex items-center gap-2'],
  },
});
