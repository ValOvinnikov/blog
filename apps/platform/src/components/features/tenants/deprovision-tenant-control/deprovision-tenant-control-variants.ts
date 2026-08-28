import { tv } from '@platform/utils/tv/tv';

export const deprovisionTenantControlVariants = tv({
  slots: {
    cardBorder: ['border-admin-bad/30'],
    cardHeader: ['border-admin-bad/20'],
    cardTitle: ['text-admin-bad'],
    content: ['flex flex-col items-start gap-3'],
    archivedRow: ['flex flex-wrap items-center gap-3'],
    switchRow: ['flex items-center gap-2.5 text-[13px] text-admin-text'],
    switchTrack: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-admin-line-2',
      'transition-colors duration-150',
      'data-[checked]:bg-admin-brand',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    switchThumb: [
      'absolute top-0.5 left-0.5 size-4 rounded-full bg-admin-surface shadow-admin',
      'transition-transform duration-150',
      'data-[checked]:translate-x-4',
    ],
  },
});
