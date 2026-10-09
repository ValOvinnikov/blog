import { tv } from '@platform/utils/tv/tv';

export const tenantOverviewViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    cardsGrid: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    cardsColumn: ['flex flex-col gap-6'],
  },
});
