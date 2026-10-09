import { tv } from '@platform/utils/tv/tv';

export const workspacePendingViewVariants = tv({
  slots: {
    content: ['text-center'],
    iconWrap: [
      'mx-auto mb-3 flex size-9 items-center justify-center rounded-full',
      'bg-admin-warn-weak text-admin-warn',
    ],
    description: ['mt-1.5'],
  },
});
