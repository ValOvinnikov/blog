import { tv } from 'tailwind-variants';

export const identitySectionVariants = tv({
  slots: {
    linkedStatus: ['text-success'],
    notLinkedStatus: ['text-text-subtle'],
    emailIcon: ['text-accent'],
    lastMethodNotice: ['font-body text-meta text-text-subtle italic'],
  },
});
