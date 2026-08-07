import { tv } from 'tailwind-variants';

export const identitySectionVariants = tv({
  slots: {
    providerName: ['inline-flex items-center gap-2'],
    providerStatusRow: ['flex basis-full items-center'],
    linkedStatus: ['text-success'],
    notLinkedStatus: ['text-text-subtle'],
    emailIcon: ['text-accent text-lg leading-none'],
    lastMethodNotice: ['font-body text-copy text-text-subtle italic'],
  },
});
