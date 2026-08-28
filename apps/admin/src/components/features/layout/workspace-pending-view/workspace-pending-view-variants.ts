import { tv } from '@admin/utils/tv/tv';

export const workspacePendingViewVariants = tv({
  slots: {
    root: [
      'flex min-h-dvh flex-col items-center justify-center bg-admin-bg p-4 text-admin-text',
    ],
    card: ['w-full max-w-sm text-center'],
    iconWrap: [
      'mx-auto mb-3 flex size-9 items-center justify-center rounded-full',
      'bg-admin-warn-weak text-admin-warn',
    ],
    description: ['mt-1.5'],
  },
});
