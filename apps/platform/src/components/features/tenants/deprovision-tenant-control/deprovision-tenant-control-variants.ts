import { tv } from '@platform/utils/tv/tv';

export const deprovisionTenantControlVariants = tv({
  slots: {
    cardBorder: ['border-admin-bad/30'],
    cardHeader: ['border-admin-bad/20'],
    cardTitle: ['text-admin-bad'],
    content: ['flex flex-col items-start gap-3'],
  },
});
