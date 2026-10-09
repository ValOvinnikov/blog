import { tv } from '@platform/utils/tv/tv';

export const previewFrameVariants = tv({
  slots: {
    root: ['@container flex min-w-0 flex-col gap-3'],
    toolbar: ['flex flex-wrap items-center gap-2'],
    // Below 27.5rem the stage leaves the frame no wider than its 390px mobile width.
    widthControl: ['@max-[27.5rem]:hidden'],
    actions: ['ml-auto flex flex-wrap items-center gap-2'],
    stage: ['rounded-admin bg-admin-line-2 p-4 sm:p-6'],
    frame: ['@container mx-auto w-full transition-[max-width]'],
    notes: ['flex flex-col gap-1 text-[12px] text-admin-muted'],
  },
  variants: {
    isNarrow: {
      true: { frame: ['max-w-[390px]'] },
      false: { frame: ['max-w-full'] },
    },
  },
});
