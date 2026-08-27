import { tv } from '@admin/utils/tv/tv';

export const addTenantWizardVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    layout: [
      'flex flex-col gap-6',
      'md:grid md:grid-cols-[230px_minmax(0,1fr)] md:items-start',
    ],
    body: ['min-w-0'],
  },
});
