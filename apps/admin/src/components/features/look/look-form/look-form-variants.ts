import { tv } from '@admin/utils/tv/tv';

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
    switchRow: ['inline-flex items-center gap-2.5 text-[13px] text-admin-text'],
    switchTrack: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-admin-line',
      'transition-colors',
      'data-[checked]:bg-admin-brand',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    switchThumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-admin',
      'transition-transform',
      'data-[checked]:translate-x-4',
    ],
    note: ['text-[12px] text-admin-muted'],
    uploads: ['grid grid-cols-1 gap-3 sm:grid-cols-2'],
  },
});
