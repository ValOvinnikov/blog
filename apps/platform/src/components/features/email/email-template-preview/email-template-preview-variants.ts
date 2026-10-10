import { PREVIEW_WIDTH } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const emailTemplatePreviewVariants = tv({
  slots: {
    root: [
      'overflow-x-auto rounded-admin border border-admin-line bg-admin-surface-2',
    ],
    frame: ['mx-auto block h-[560px] max-w-none bg-white'],
  },
  variants: {
    width: {
      [PREVIEW_WIDTH.DESKTOP]: { frame: ['w-[600px]'] },
      [PREVIEW_WIDTH.MOBILE]: { frame: ['w-[375px]'] },
    },
  },
  defaultVariants: { width: PREVIEW_WIDTH.DESKTOP },
});
