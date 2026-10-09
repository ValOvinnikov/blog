import { tv } from '@platform/utils/tv/tv';

export const addTenantWizardVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    layout: [
      'flex flex-col gap-6',
      'lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start',
    ],
    body: ['min-w-0'],
  },
});
