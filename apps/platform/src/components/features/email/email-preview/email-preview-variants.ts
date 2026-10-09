import { tv } from '@platform/utils/tv/tv';

export const emailPreviewVariants = tv({
  slots: {
    message: ['flex flex-col gap-3'],
    envelope: [
      'rounded-admin border border-admin-line bg-admin-surface px-[14px] py-3',
    ],
  },
});
