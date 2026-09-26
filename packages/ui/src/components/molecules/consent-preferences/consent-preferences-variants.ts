import { tv } from '@blog/ui/lib/styling';

export const consentPreferencesVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    heading: ['text-text'],
    list: ['flex flex-col'],
    actions: ['flex justify-end pt-2'],
  },
});
