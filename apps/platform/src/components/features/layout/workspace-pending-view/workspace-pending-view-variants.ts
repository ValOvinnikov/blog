import { tv } from '@platform/utils/tv/tv';

export const workspacePendingViewVariants = tv({
  slots: {
    content: ['flex items-start gap-3'],
    iconWrap: [
      'flex size-9 shrink-0 items-center justify-center rounded-full',
      'bg-admin-warn-weak text-admin-warn',
    ],
  },
});
