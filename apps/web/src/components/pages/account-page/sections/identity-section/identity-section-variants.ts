import { tv } from 'tailwind-variants';

export const identitySectionVariants = tv({
  slots: {
    providerRow: [
      'flex flex-wrap items-center gap-2 py-2',
      'border-t border-dashed border-border first:border-t-0',
    ],
    providerName: ['inline-flex items-center gap-2'],
    providerStatus: ['ml-auto flex flex-col items-end gap-1 text-right'],
    linkedStatus: ['text-success'],
    emailIcon: ['text-accent text-lg leading-none'],
    lastMethodNotice: ['font-body text-copy text-text-subtle italic'],
  },
});
