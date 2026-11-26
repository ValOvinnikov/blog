import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const identitySectionVariants = tv({
  slots: {
    providerRow: [
      'flex flex-wrap items-center gap-2 py-2',
      'border-t border-dashed border-border first:border-t-0',
    ],
    providerName: ['inline-flex items-center gap-2'],
    providerStatus: ['ml-auto flex flex-col items-end gap-1 text-right'],
    linkedStatus: ['font-mono text-copy text-success'],
    emailIcon: ['text-brand-primary text-lg leading-none'],
    lastMethodNotice: ['font-body text-copy text-text-subtle italic'],
    linkError: [TYPOGRAPHY[TEXT_ROLE.META], 'text-error'],
  },
});
