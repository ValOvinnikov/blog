import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const assetUploadFieldVariants = tv({
  slots: {
    field: ['flex flex-col gap-[5px]'],
    row: ['flex items-center gap-3'],
    root: ['flex bg-platform-surface-2'],
    top: ['flex items-center gap-3'],
    error: ['text-platform-11-5 text-platform-bad'],
  },
  variants: {
    size: {
      [SIZE.MD]: {
        root: [
          'flex-col rounded-platform border-[1.5px] border-dashed border-platform-line p-[14px]',
        ],
      },
      [SIZE.SM]: {
        field: ['@container'],
        root: [
          'flex-wrap items-center gap-3 rounded-platform border border-platform-line px-3 py-2.5',
        ],
        top: ['min-w-0 flex-1'],
      },
    },
    isInvalid: {
      true: { root: ['border-platform-bad-line'] },
    },
  },
  defaultVariants: {
    isInvalid: false,
    size: SIZE.MD,
  },
});
