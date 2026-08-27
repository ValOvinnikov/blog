import { tv } from 'tailwind-variants';

export const tenantOverviewViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    cardsGrid: ['grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2'],
    cardsColumn: ['flex flex-col gap-[18px]'],
    activityList: ['flex flex-col'],
    activityRow: [
      'flex items-center gap-3 py-2.5',
      'border-b border-admin-line-2 last:border-b-0',
    ],
    activityIcon: [
      'flex h-7 w-7 flex-none items-center justify-center',
      'rounded-full bg-admin-surface-2 text-sm text-admin-muted',
    ],
    activityBody: ['min-w-0 flex-1'],
    activityMessage: ['block text-[13px] text-admin-text'],
    activitySub: ['block text-[12px] text-admin-faint'],
    activityTime: ['flex-none text-[12px] text-admin-muted'],
    activityEmpty: ['text-[13px] text-admin-muted'],
  },
});
