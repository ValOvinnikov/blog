import { tv } from '@platform/utils/tv/tv';

export const tenantDangerPageContentVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    actionsRow: [
      'flex flex-col gap-6',
      'lg:grid lg:grid-cols-2 lg:items-start',
    ],
    historySection: ['flex flex-col gap-3'],
  },
});
