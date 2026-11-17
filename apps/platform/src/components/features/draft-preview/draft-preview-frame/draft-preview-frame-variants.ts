import { tv } from '@platform/utils/tv/tv';

export const draftPreviewFrameVariants = tv({
  slots: {
    frame: [
      'mx-auto block h-[75vh] min-h-[560px] max-w-full',
      'rounded-platform border border-platform-line bg-platform-surface',
    ],
  },
});
