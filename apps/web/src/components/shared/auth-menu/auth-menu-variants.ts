import { tv } from 'tailwind-variants';

export const authMenuVariants = tv({
  slots: {
    placeholder: ['size-[22px]'],
    signInTrigger: [
      'size-auto whitespace-nowrap rounded-sm border border-border-strong bg-surface px-3 py-1.5',
      'font-mono text-label text-text',
      'transition-colors duration-base ease-console',
      'hover:border-accent hover:text-accent',
    ],
    avatarTrigger: ['size-8 rounded-full'],
    accountHeader: ['flex flex-col gap-0.5 px-3 py-2'],
    accountName: ['font-mono text-copy text-text'],
    accountEmail: ['font-mono text-meta text-subtle'],
    signOutItem: ['text-danger'],
    // Deliberately a sibling of `PopoverMenu.Panel`, not a child of it — the
    // panel is `hidden` while the popover is closed, which would remove an
    // alert rendered inside it from the accessibility tree at exactly the
    // moment (an OAuth redirect-back) it needs to announce. Positioned like
    // the panel itself (`PopoverMenu`'s root is `relative`) so it still reads
    // as "near the sign-in button".
    errorNotice: [
      'absolute top-full left-0 z-20 mt-2 min-w-[220px]',
      'rounded-md border border-border bg-surface px-3 py-2 shadow-lg',
      'font-mono text-meta text-danger',
    ],
    emailForm: ['flex flex-col gap-2 px-3 py-2'],
    emailFormActions: ['flex items-center gap-2'],
    emailHint: ['font-mono text-meta text-danger'],
    emailSent: ['px-3 py-2 font-mono text-meta text-ok'],
  },
});
