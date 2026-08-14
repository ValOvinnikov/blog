import { tv } from 'tailwind-variants';

export const signInMenuVariants = tv({
  slots: {
    // `min-h-0`/`font-normal` guard against `Button`'s own base `min-h-9`/
    // `font-medium` bleeding through when this renders via the `Button` atom
    // (the loading placeholder) — neither conflicts by classGroup with
    // anything else here, so nothing here would otherwise cancel them, and
    // the placeholder would end up taller/bolder than the real trigger.
    signInTrigger: [
      'size-auto min-h-0 whitespace-nowrap rounded-sm border border-border-strong bg-surface px-3 py-1.5',
      'font-mono font-normal text-label text-text',
      'transition-colors duration-base ease-console',
      'hover:border-brand-primary hover:text-brand-primary',
    ],
    cmdLine: [
      'mb-3 flex items-center gap-1.5',
      'font-mono text-copy text-muted',
    ],
    cmdPrompt: ['text-brand-primary'],
    cmdCursor: [
      'inline-block h-[1em] w-[0.5ch] bg-brand-primary',
      'animate-[blink_1s_steps(1)_infinite]',
    ],
    plainLabel: ['mb-3 font-semibold text-text'],
    plainPrompt: ['mb-3'],
    providerButton: [
      'mt-2 w-full justify-start gap-2 rounded-sm border border-border-strong bg-surface px-3.5 py-2',
      'font-mono text-label text-text',
      'transition-colors duration-base ease-console',
      'hover:border-brand-primary hover:bg-surface hover:text-brand-primary',
    ],
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
    ],
    emailForm: ['mt-2 flex flex-col gap-2'],
    emailFormActions: ['flex items-center gap-2'],
    emailHint: ['font-mono text-meta text-error'],
    emailSent: ['mt-2 font-mono text-meta text-success'],
  },
});
