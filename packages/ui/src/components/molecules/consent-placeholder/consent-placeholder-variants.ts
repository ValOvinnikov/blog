import { tv } from '@blog/ui/lib/styling';

export const consentPlaceholderVariants = tv({
  slots: {
    content: [
      'absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center',
    ],
    provider: ['font-mono text-copy font-medium text-text'],
    message: ['max-w-prose text-card-copy text-subtle'],
    actions: ['flex flex-wrap items-center justify-center gap-2'],
    scope: ['max-w-prose text-card-copy text-subtle'],
  },
});
