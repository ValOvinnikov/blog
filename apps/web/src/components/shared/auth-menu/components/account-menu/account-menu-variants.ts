import { tv } from 'tailwind-variants';

export const accountMenuVariants = tv({
  slots: {
    // `PopoverMenu`'s own base has no alignment opinion — needed here (but
    // not by every `PopoverMenu` consumer, e.g. `SignInMenu`) because this
    // trigger is a 32px circular `Avatar`, not text/icon content that
    // already centers against its header siblings (`ThemeToggleButton`'s
    // `IconButton`) by default.
    menuRoot: ['flex flex-col items-center'],
    // Guards the flex-wrap header row — the trigger's `avatar` variant
    // already sizes/shapes it to match the 32px `Avatar` it wraps.
    avatarTrigger: ['shrink-0'],
    acctRow: ['mb-2 flex items-center gap-2 border-b border-border pb-3'],
    accountName: ['font-mono text-copy text-text'],
    accountEmail: ['font-mono text-meta text-subtle'],
    signOutItem: ['text-error'],
  },
});
