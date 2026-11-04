import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const assetUploadFieldVariants = tv({
  slots: {
    field: ['flex flex-col gap-[5px]'],
    row: ['flex items-center gap-3'],
    root: ['flex bg-admin-surface-2'],
    top: ['flex items-center gap-3'],
    error: ['text-admin-11-5 text-admin-bad'],
  },
  variants: {
    size: {
      [SIZE.MD]: {
        root: [
          'flex-col rounded-admin border-[1.5px] border-dashed border-admin-line p-[14px]',
        ],
      },
      [SIZE.SM]: {
        field: ['@container'],
        root: [
          'flex-wrap items-center gap-3 rounded-admin border border-admin-line px-3 py-2.5',
        ],
        top: ['min-w-0 flex-1'],
      },
    },
    isInvalid: {
      true: { root: ['border-admin-bad-line'] },
    },
  },
  defaultVariants: {
    isInvalid: false,
    size: SIZE.MD,
  },
});
