import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const assetUploadActionsVariants = tv({
  slots: {
    root: ['flex items-center gap-2'],
    input: ['sr-only'],
  },
  variants: {
    size: {
      [SIZE.MD]: { root: ['mt-[11px] flex-wrap'] },
      [SIZE.SM]: { root: ['shrink-0 @max-lg:basis-full'] },
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});
