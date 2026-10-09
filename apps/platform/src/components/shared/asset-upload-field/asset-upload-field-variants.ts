import { tv } from '@platform/utils/tv/tv';

export const assetUploadFieldVariants = tv({
  slots: {
    field: ['flex flex-col gap-[5px]'],
    root: ['flex bg-admin-surface-2'],
    top: ['flex items-center gap-3'],
    thumb: [
      'relative flex shrink-0 items-center justify-center overflow-hidden',
      'border border-admin-line bg-admin-surface text-[10px] text-admin-faint',
    ],
    thumbImage: ['object-contain'],
    text: ['min-w-0'],
    titleRow: ['flex min-w-0 items-center gap-2'],
    title: ['truncate text-[13px] font-semibold text-admin-text'],
    fileName: ['mt-0.5 truncate text-[11.5px] text-admin-muted'],
    hint: ['mt-0.5 text-[11.5px] text-admin-muted'],
    actions: ['flex items-center gap-2'],
    input: ['sr-only'],
    error: ['text-[11.5px] text-admin-bad'],
  },
  variants: {
    size: {
      md: { thumb: ['size-12 rounded-[10px]'] },
      sm: { thumb: ['size-10 rounded-[8px]'] },
    },
    layout: {
      box: {
        root: [
          'flex-col rounded-admin border-[1.5px] border-dashed border-admin-line p-[14px]',
        ],
        actions: ['mt-[11px] flex-wrap'],
      },
      row: {
        field: ['@container'],
        root: [
          'flex-wrap items-center gap-3 rounded-admin-sm border border-admin-line px-3 py-2.5',
        ],
        top: ['min-w-0 flex-1'],
        titleRow: ['flex-wrap'],
        actions: ['shrink-0 @max-lg:basis-full'],
      },
    },
  },
  defaultVariants: {
    size: 'md',
    layout: 'box',
  },
});
