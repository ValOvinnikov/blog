import { tv } from '@platform/utils/tv/tv';

export const assetUploadDetailsVariants = tv({
  slots: {
    root: ['min-w-0'],
    title: ['truncate text-platform-13 font-semibold text-platform-text'],
    fileName: ['mt-0.5 truncate text-platform-11-5 text-platform-muted'],
    hint: ['mt-0.5'],
  },
});
