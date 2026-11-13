import { tv } from '@platform/utils/tv/tv';

export const emailPreviewVariants = tv({
  slots: {
    message: ['flex flex-col gap-3'],
    envelope: [
      'rounded-platform border border-platform-line bg-platform-surface px-[14px] py-3',
    ],
  },
});
