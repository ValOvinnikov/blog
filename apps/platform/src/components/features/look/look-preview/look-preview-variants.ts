import { tv } from '@platform/utils/tv/tv';

export const lookPreviewVariants = tv({
  slots: {
    root: ['flex flex-col gap-3'],
    toolbar: ['flex flex-wrap items-center gap-2'],
    stage: ['rounded-admin bg-admin-line-2 p-4 sm:p-6'],
    frame: ['mx-auto w-full transition-[max-width]'],
    note: ['text-[12px] text-admin-muted'],
  },
  variants: {
    isMobile: {
      true: { frame: ['max-w-[390px]'] },
      false: { frame: ['max-w-full'] },
    },
  },
});
