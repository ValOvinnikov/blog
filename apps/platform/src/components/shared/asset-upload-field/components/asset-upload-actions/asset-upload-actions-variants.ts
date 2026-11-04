import { SIZE } from '@blog/config';
import { ASSET_UPLOAD_LAYOUT } from '@platform/constants/asset-upload';
import { tv } from '@platform/utils/tv/tv';

const BARE_BUTTON = 'h-8 py-0 text-admin-13 font-semibold';

export const assetUploadActionsVariants = tv({
  slots: {
    root: ['flex items-center gap-2'],
    input: ['sr-only'],
    pickButton: [],
    pickContent: [],
    removeButton: [],
  },
  variants: {
    size: {
      [SIZE.MD]: {},
      [SIZE.SM]: {},
    },
    layout: {
      [ASSET_UPLOAD_LAYOUT.FRAMED]: {},
      [ASSET_UPLOAD_LAYOUT.BARE]: {
        root: ['min-w-0 flex-wrap'],
        pickButton: [BARE_BUTTON, 'px-3'],
        pickContent: ['inline-flex items-center gap-2'],
        removeButton: [
          BARE_BUTTON,
          'px-[10px] text-admin-brand-strong md:px-[10px] md:py-0',
        ],
      },
    },
  },
  compoundVariants: [
    {
      layout: ASSET_UPLOAD_LAYOUT.FRAMED,
      size: SIZE.MD,
      class: { root: ['mt-[11px] flex-wrap'] },
    },
    {
      layout: ASSET_UPLOAD_LAYOUT.FRAMED,
      size: SIZE.SM,
      class: { root: ['shrink-0 @max-lg:basis-full'] },
    },
  ],
  defaultVariants: {
    size: SIZE.MD,
    layout: ASSET_UPLOAD_LAYOUT.FRAMED,
  },
});
