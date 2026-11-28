import { PREVIEW_WIDTH } from '@platform/constants/preview';
import { tv } from '@platform/utils/tv/tv';

export const emailTemplatePreviewVariants = tv({
  slots: {
    root: [
      'overflow-hidden rounded-platform border border-platform-line bg-platform-surface-2',
    ],
    frame: ['mx-auto block h-[560px] w-full bg-white'],
  },
  variants: {
    width: {
      [PREVIEW_WIDTH.DESKTOP]: { frame: ['max-w-[600px]'] },
      [PREVIEW_WIDTH.MOBILE]: { frame: ['max-w-[375px]'] },
    },
  },
  defaultVariants: { width: PREVIEW_WIDTH.DESKTOP },
});
