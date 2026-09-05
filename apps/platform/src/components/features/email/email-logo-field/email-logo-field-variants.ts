import { tv } from '@platform/utils/tv/tv';

export const emailLogoFieldVariants = tv({
  slots: {
    root: [
      'flex flex-col rounded-admin border-[1.5px] border-dashed border-admin-line bg-admin-surface-2 p-[14px]',
    ],
    top: ['flex items-center gap-3'],
    thumb: [
      'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px]',
      'border border-admin-line bg-admin-surface text-[10px] text-admin-faint',
    ],
    thumbImage: ['object-contain'],
    text: ['min-w-0'],
    title: ['text-[13px] font-semibold text-admin-text'],
    hint: ['mt-0.5 text-[11.5px] text-admin-muted'],
    actions: ['mt-[11px] flex flex-wrap items-center gap-2'],
    input: ['sr-only'],
  },
});
