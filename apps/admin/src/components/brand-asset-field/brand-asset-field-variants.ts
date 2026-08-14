import { tv } from 'tailwind-variants';

export const brandAssetFieldVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-3 rounded-lg border-2 border-dashed border-border bg-surface-2 p-3.5',
    ],
    top: ['flex items-center gap-3'],
    thumb: [
      'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md',
      'border border-border bg-surface text-meta text-text-subtle',
    ],
    thumbImage: ['size-full object-contain'],
    text: ['min-w-0'],
    title: ['text-sm font-semibold text-text'],
    hint: ['text-xs text-text-subtle'],
    actions: ['flex flex-wrap items-center gap-2'],
    input: ['sr-only'],
  },
});
