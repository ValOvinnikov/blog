import { tv } from 'tailwind-variants';

export const recentActivityCardVariants = tv({
  slots: {
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
