import { tv } from '@admin/utils/tv/tv';

export const tenantOverviewViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    cardsGrid: ['grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2'],
    cardsColumn: ['flex flex-col gap-[18px]'],
  },
});
