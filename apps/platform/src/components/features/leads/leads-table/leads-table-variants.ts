import { tv } from '@platform/utils/tv/tv';

export const leadsTableVariants = tv({
  slots: {
    visuallyHidden: ['sr-only'],
    received: ['whitespace-nowrap'],
    email: [
      'break-all rounded-admin-control text-admin-brand underline underline-offset-2',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    sourcePath: ['break-all'],
  },
});
