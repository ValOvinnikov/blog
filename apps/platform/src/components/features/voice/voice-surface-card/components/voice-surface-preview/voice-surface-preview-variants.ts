import { tv } from '@platform/utils/tv/tv';

export const voiceSurfacePreviewVariants = tv({
  slots: {
    column: [
      'lg:rounded-br-admin lg:border-l lg:border-admin-line-2 lg:bg-admin-bg lg:p-[18px]',
    ],
    content: [
      'flex flex-col gap-2.5 lg:sticky lg:top-admin-topbar lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto lg:overscroll-contain',
    ],
    toggle: ['w-full md:h-11 lg:hidden'],
    preview: [
      'flex flex-col gap-2.5',
      'max-lg:rounded-admin max-lg:border max-lg:border-admin-line-2 max-lg:bg-admin-bg max-lg:p-3.5',
    ],
    label: [
      'font-admin-mono text-admin-11 leading-[15px] font-medium tracking-admin-caps text-admin-muted uppercase',
    ],
    specimen: ['grid'],
    note: ['text-admin-12 leading-4 text-admin-muted'],
  },
  variants: {
    isArchive: {
      true: {
        column: [
          'max-lg:px-[18px] max-lg:pt-1.5 max-lg:pb-[18px]',
          'max-md:px-3.5 max-md:pb-2.5',
        ],
        specimen: ['min-h-[260px]'],
      },
      false: {
        column: ['max-lg:hidden'],
      },
    },
    isPreviewOpen: {
      false: { preview: ['max-lg:hidden'] },
    },
  },
});
