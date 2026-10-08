import { tv } from '@platform/utils/tv/tv';

export const lookPreviewVariants = tv({
  slots: {
    actions: ['flex flex-wrap items-center gap-2'],
    frame: ['mx-auto w-full transition-[max-width]'],
    note: ['mt-3 text-[12px] text-admin-muted'],
  },
  variants: {
    isMobile: {
      true: { frame: ['max-w-[390px]'] },
      false: { frame: ['max-w-full'] },
    },
  },
});
