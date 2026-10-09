import { tv } from '@platform/utils/tv/tv';

export const voiceSurfaceCardVariants = tv({
  slots: {
    body: ['grid grid-cols-1 items-start gap-5 lg:grid-cols-2'],
    fields: ['flex flex-col gap-4'],
    previewColumn: ['flex flex-col gap-3 lg:sticky lg:top-[68px]'],
    previewToggle: ['w-full lg:hidden'],
    preview: ['flex flex-col gap-3 border-l border-admin-line bg-admin-bg p-4'],
    previewLabel: [
      'font-mono text-[11px] font-bold uppercase tracking-[.06em] text-admin-muted',
    ],
    previewNote: ['text-[12px] text-admin-muted'],
    customisedCount: ['text-[12px] font-medium text-admin-muted'],
  },
  variants: {
    isPreviewOpen: {
      false: { preview: ['max-lg:hidden'] },
    },
  },
});
