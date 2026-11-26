import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

const NOTICE = ['max-w-prose', TYPOGRAPHY[TEXT_ROLE.CARD_BODY], 'text-subtle'];

export const consentPlaceholderVariants = tv({
  slots: {
    content: [
      'absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto p-4 text-center',
    ],
    provider: ['font-mono text-copy font-medium text-text'],
    message: NOTICE,
    actions: ['flex flex-wrap items-center justify-center gap-2'],
    scope: NOTICE,
  },
});
