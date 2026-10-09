import { tv } from '@platform/utils/tv/tv';

export const tenantDetailsPanelVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    bodyStack: ['flex flex-col gap-4'],
    fields: [
      'grid grid-cols-1 gap-x-[18px] gap-y-4 lg:grid-cols-2',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
    lockAnnouncementLive: ['sr-only'],
    wideField: ['lg:col-span-2'],
    planControl: ['self-start'],
    footerActions: ['ml-auto flex items-center gap-2.5'],
  },
});
