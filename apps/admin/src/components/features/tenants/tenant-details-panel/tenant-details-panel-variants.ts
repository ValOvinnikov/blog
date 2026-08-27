import { tv } from '@admin/utils/tv/tv';

export const tenantDetailsPanelVariants = tv({
  slots: {
    bodyStack: ['flex flex-col gap-4'],
    fields: [
      'flex flex-col gap-5',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
    fieldLockReason: ['text-[11.5px] text-admin-faint'],
    lockAnnouncementLive: ['sr-only'],
    planControl: ['self-start'],
  },
});
