import { tv } from '@blog/ui/lib/styling';
import { SHEET_BELOW_LG } from '@web/components/shared/auth-menu/auth-menu-variants';

export const signInMenuVariants = tv({
  slots: {
    label: ['mb-3'],
    providerPrompt: ['mb-3'],
    providerButton: ['mt-2 max-lg:min-h-11'],
    hint: ['mt-3 font-mono text-meta text-subtle'],
    // Deliberately a sibling of `PopoverMenu.Panel`, not a child of it — the
    // panel is `hidden` while the popover is closed, which would remove an
    // alert rendered inside it from the accessibility tree at exactly the
    // moment (an OAuth redirect-back) it needs to announce. Positioned like
    // the panel itself (`PopoverMenu`'s root is `relative`) so it still reads
    // as "near the sign-in button".
    errorNotice: [
      'absolute top-full left-0 z-20 mt-2 min-w-[220px]',
      'rounded-md border border-border bg-surface px-3 py-2 shadow-lg',
      'font-mono text-meta text-error',
      SHEET_BELOW_LG,
    ],
    emailForm: ['mt-2 flex flex-col gap-2'],
    emailFormActions: ['flex items-center gap-2'],
    sendButton: ['max-lg:min-h-11'],
    emailHint: ['font-mono text-meta text-error'],
    emailSent: ['mt-2 font-mono text-meta text-success'],
  },
});
