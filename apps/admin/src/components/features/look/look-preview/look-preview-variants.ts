import { tv } from 'tailwind-variants';

export const lookPreviewVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    note: ['text-[12px] text-admin-muted'],
    deviceBar: [
      'flex items-center gap-2 rounded-admin-sm border border-admin-line bg-admin-surface-2 px-3 py-2',
    ],
    deviceDots: ['flex gap-1.5'],
    deviceDot: ['size-2 rounded-full bg-admin-line'],
    deviceUrl: [
      'flex-1 truncate text-center font-mono text-xs text-admin-faint',
    ],
    frame: [
      'mt-3 flex min-h-40 items-center justify-center rounded-admin-sm border border-dashed border-admin-line p-4',
    ],
    framePlaceholder: ['text-center text-xs text-admin-faint'],
  },
});
