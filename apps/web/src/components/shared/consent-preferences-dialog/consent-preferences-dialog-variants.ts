import { tv } from '@blog/ui/lib/styling';

export const consentPreferencesDialogVariants = tv({
  slots: {
    root: [
      'm-auto w-full max-w-lg p-6',
      'rounded-md border border-border bg-surface text-text shadow-lg',
      'backdrop:bg-black/50',
    ],
  },
});
