import { tv } from '@platform/utils/tv/tv';

export const tenantDetailsPanelVariants = tv({
  slots: {
    bodyStack: ['flex flex-col gap-4'],
    fields: [
      'grid grid-cols-1 gap-x-[18px] gap-y-4 lg:grid-cols-2',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
    fieldLockReason: ['text-[11.5px] text-admin-faint'],
    lockAnnouncementLive: ['sr-only'],
    planControl: ['self-start'],
    footerActions: ['ml-auto flex items-center gap-2.5'],
  },
});
