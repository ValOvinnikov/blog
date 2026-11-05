import { tv } from '@platform/utils/tv/tv';

export const assetUploadDetailsVariants = tv({
  slots: {
    root: ['min-w-0'],
    title: ['truncate text-admin-13 font-semibold text-admin-text'],
    fileName: ['mt-0.5 truncate text-admin-11-5 text-admin-muted'],
    hint: ['mt-0.5'],
  },
});
