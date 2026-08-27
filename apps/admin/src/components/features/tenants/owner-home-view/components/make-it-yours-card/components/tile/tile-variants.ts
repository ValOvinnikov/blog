import { tv } from '@admin/utils/tv/tv';

export const tileVariants = tv({
  slots: {
    root: [
      'flex flex-col items-start gap-0.5',
      'rounded-admin border border-admin-line bg-admin-surface p-3.5',
      'shadow-admin no-underline',
      'hover:border-admin-brand hover:bg-admin-surface-2',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    icon: ['text-admin-text'],
    title: ['mt-1.5 text-sm font-semibold text-admin-text'],
    description: ['text-xs text-admin-muted'],
  },
});
