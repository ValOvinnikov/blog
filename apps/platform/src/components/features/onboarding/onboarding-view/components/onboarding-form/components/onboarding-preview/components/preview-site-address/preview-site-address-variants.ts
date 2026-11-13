import { tv } from '@platform/utils/tv/tv';

export const previewSiteAddressVariants = tv({
  slots: {
    root: ['inline-flex min-w-0 max-w-full items-center gap-1.5'],
    icon: ['text-platform-muted'],
    label: ['sr-only'],
    address: [
      'min-w-0 truncate font-platform-mono text-platform-12 leading-[18px] font-medium text-platform-text',
    ],
  },
});
