import { tv } from '@platform/utils/tv/tv';

export const brandAssetFieldVariants = tv({
  slots: {
    root: [
      'flex flex-col rounded-admin border-[1.5px] border-dashed border-admin-line bg-admin-surface-2 p-[14px]',
    ],
    top: ['flex items-center gap-3'],
    thumb: [
      'relative flex shrink-0 items-center justify-center overflow-hidden',
      'border border-admin-line bg-admin-surface text-[10px] text-admin-faint',
    ],
    thumbImage: ['object-contain'],
    text: ['min-w-0'],
    title: ['text-[13px] font-semibold text-admin-text'],
    hint: ['mt-0.5 text-[11.5px] text-admin-muted'],
    actions: ['mt-[11px] flex flex-wrap items-center gap-2'],
    input: ['sr-only'],
  },
  variants: {
    kind: {
      logo: { thumb: ['size-12 rounded-[10px]'] },
      favicon: { thumb: ['size-10 rounded-[8px]'] },
    },
  },
  defaultVariants: {
    kind: 'logo',
  },
});
