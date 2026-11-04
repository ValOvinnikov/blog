import { SIZE } from '@blog/config';
import { ASSET_UPLOAD_LAYOUT } from '@platform/constants/asset-upload';
import { tv } from '@platform/utils/tv/tv';

export const assetUploadThumbVariants = tv({
  slots: {
    root: [
      'relative flex shrink-0 items-center justify-center overflow-hidden',
      'rounded-admin-control border border-admin-line',
    ],
    image: ['object-contain'],
  },
  variants: {
    size: {
      [SIZE.MD]: { root: ['size-12'] },
      [SIZE.SM]: { root: ['size-10'] },
    },
    layout: {
      [ASSET_UPLOAD_LAYOUT.FRAMED]: {
        root: ['bg-admin-surface text-[10px] text-admin-muted'],
      },
      [ASSET_UPLOAD_LAYOUT.BARE]: { root: ['size-13 bg-admin-surface-2'] },
    },
    isEmpty: {
      true: {},
    },
  },
  compoundVariants: [
    {
      layout: ASSET_UPLOAD_LAYOUT.BARE,
      isEmpty: true,
      class: {
        root: ['border-dashed border-admin-control-line bg-admin-surface'],
      },
    },
  ],
  defaultVariants: {
    size: SIZE.MD,
    layout: ASSET_UPLOAD_LAYOUT.FRAMED,
    isEmpty: false,
  },
});
