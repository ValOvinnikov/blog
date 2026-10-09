import { tv } from '@platform/utils/tv/tv';

export const deprovisioningStatusViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    cardsRow: ['flex flex-col gap-6', 'lg:grid lg:grid-cols-2 lg:items-start'],
    stepsCard: ['bg-admin-surface'],
    stepsSummary: ['flex items-center gap-2.5'],
    overallStatusLive: ['inline-flex items-center'],
  },
});
