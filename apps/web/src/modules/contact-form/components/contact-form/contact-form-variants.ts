import { tv } from '@blog/ui/lib/styling';

export const contactFormVariants = tv({
  slots: {
    form: ['grid grid-cols-1 gap-4', 'sm:grid-cols-2'],
    fullWidth: ['sm:col-span-2'],
    honeypot: ['absolute -left-[9999px] h-px w-px overflow-hidden'],
    actions: ['flex flex-col items-start gap-3', 'sm:col-span-2'],
    privacyNote: ['text-meta text-muted'],
  },
});
