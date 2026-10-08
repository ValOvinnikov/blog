import { tv } from '@platform/utils/tv/tv';

export const voiceSurfaceCardVariants = tv({
  slots: {
    body: ['grid grid-cols-1 items-start gap-5 lg:grid-cols-2'],
    fields: ['flex flex-col gap-5'],
    previewColumn: ['flex flex-col gap-3 lg:sticky lg:top-[68px]'],
    previewToggle: ['min-h-11 w-full lg:hidden'],
    preview: [],
    customisedCount: ['text-[12px] font-medium text-admin-muted'],
  },
  variants: {
    isPreviewOpen: {
      false: { preview: ['max-lg:hidden'] },
    },
  },
});
