import { tv } from '@platform/utils/tv/tv';

export const voiceSurfaceCardVariants = tv({
  slots: {
    body: ['grid grid-cols-1 p-0 lg:grid-cols-2'],
    fields: ['flex flex-col gap-4 p-[18px]'],
    previewColumn: [
      'px-[18px] pb-[18px]',
      'lg:rounded-br-admin lg:border-l lg:border-admin-line lg:bg-admin-bg lg:p-4',
    ],
    previewContent: [
      'flex flex-col gap-3 lg:sticky lg:top-[68px] lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto lg:overscroll-contain',
    ],
    previewToggle: ['w-full lg:hidden'],
    preview: [
      'flex flex-col gap-3',
      'max-lg:border-l max-lg:border-admin-line max-lg:bg-admin-bg max-lg:p-4',
    ],
    previewLabel: [
      'font-mono text-[11px] font-bold uppercase tracking-[.06em] text-admin-muted',
    ],
    previewNote: ['text-[12px] text-admin-muted'],
    summary: ['text-[12px] font-medium text-admin-muted'],
  },
  variants: {
    isPreviewOpen: {
      false: { preview: ['max-lg:hidden'] },
    },
  },
});
