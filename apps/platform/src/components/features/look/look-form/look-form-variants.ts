import { tv } from '@platform/utils/tv/tv';

export const lookFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    grid: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    stack: ['flex flex-col gap-6'],
    field: ['mb-[18px] last:mb-0'],
    fieldLabel: [
      'mb-[5px] flex items-center gap-2 text-[13px] font-semibold text-admin-text',
    ],
    fieldHint: ['-mt-px mb-2 text-[12px] text-admin-muted'],
    tagSecondary: [
      'rounded-full bg-admin-line-2 px-2 py-px text-[11px] font-medium text-admin-faint',
    ],
    hueField: ['flex w-full items-center gap-3.5'],
    swatch: [
      'size-[52px] shrink-0 rounded-admin shadow-admin ring-1 ring-inset ring-black/6',
    ],
    hueValue: [
      'min-w-[92px] shrink-0 text-right text-[12.5px] tabular-nums text-admin-muted',
    ],
    note: ['text-[12px] text-admin-muted'],
    uploads: ['grid grid-cols-1 gap-3 sm:grid-cols-2'],
  },
});
