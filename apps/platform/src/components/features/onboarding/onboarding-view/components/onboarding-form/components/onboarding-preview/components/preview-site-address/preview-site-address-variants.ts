import { tv } from '@platform/utils/tv/tv';

export const previewSiteAddressVariants = tv({
  slots: {
    root: ['inline-flex min-w-0 max-w-full items-center gap-1.5'],
    icon: ['text-admin-muted'],
    label: ['sr-only'],
    address: [
      'min-w-0 truncate font-admin-mono text-admin-12 leading-[18px] font-medium text-admin-text',
    ],
  },
});
