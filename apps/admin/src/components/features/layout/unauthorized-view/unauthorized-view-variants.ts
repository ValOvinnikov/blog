import { tv } from '@admin/utils/tv/tv';

export const unauthorizedViewVariants = tv({
  slots: {
    root: [
      'flex min-h-dvh flex-col items-center justify-center bg-admin-bg p-4 text-admin-text',
    ],
    card: ['w-full max-w-sm text-center'],
    iconWrap: [
      'mx-auto mb-3 flex size-9 items-center justify-center rounded-full',
      'bg-admin-bad-weak text-admin-bad',
    ],
    description: ['mt-1.5'],
  },
});
