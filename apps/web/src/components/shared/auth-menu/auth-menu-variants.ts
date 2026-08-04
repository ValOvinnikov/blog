import { tv } from 'tailwind-variants';

export const authMenuVariants = tv({
  slots: {
    // Reserves the shell's real footprint while its label stays out of
    // sight (`visibility:hidden`, not removed) — matches `ThemeToggle`'s own
    // mounted-placeholder pattern of hiding content, never the shell itself.
    placeholderLabel: ['invisible'],
    signInTrigger: [
      'size-auto whitespace-nowrap rounded-sm border border-border-strong bg-surface px-3 py-1.5',
      'font-mono text-label text-text',
      'transition-colors duration-base ease-console',
      'hover:border-accent hover:text-accent',
    ],
    // `size-8` (32px) is `Avatar`'s smallest built-in size (`Size.SM` — no
    // smaller option exists yet) — already the tightest fit around it
    // without cropping the circle; `shrink-0` guards the flex-wrap header row.
    // `border-emphasis`, not `border-strong` — `border-strong` fails WCAG
    // 1.4.11's 3:1 non-text contrast against `--bg` (1.81:1 light / 2.26:1
    // dark); `border-emphasis` clears it (3.54:1 / 3.94:1) — same fix as
    // `icon-button-variants.ts`.
    avatarTrigger: [
      'size-8 shrink-0 rounded-full',
      'transition-shadow duration-base ease-console',
      'hover:ring-2 hover:ring-border-emphasis hover:ring-offset-2 hover:ring-offset-bg',
    ],
    // `PopoverMenu.Panel` only positions the window now (`WindowChrome` owns
    // the visual surface — border/bg/radius/shadow) — its own chrome is
    // cancelled here rather than doubled up.
    panel: [
      'min-w-0 max-w-none rounded-none border-0 bg-transparent p-0 shadow-none',
    ],
    // Fixed width, not just a max-width — `absolute right-0` + `width:auto`
    // shrink-fits toward the panel's 200px floor otherwise, wrapping long
    // items; 320px fits every item on one line, capped against the viewport.
    window: ['w-80 max-w-[calc(100vw-2rem)]'],
    cmdLine: [
      'mb-3 flex items-center gap-1.5',
      'font-mono text-copy text-muted',
    ],
    cmdPrompt: ['text-accent'],
    cmdCursor: [
      'inline-block h-[1em] w-[0.5ch] bg-accent',
      'animate-[blink_1s_steps(1)_infinite]',
    ],
    providerButton: [
      'mt-2 w-full justify-start gap-2 rounded-sm border border-border-strong bg-surface px-3.5 py-2',
      'font-mono text-label text-text',
      'transition-colors duration-base ease-console',
      'hover:border-accent hover:bg-surface hover:text-accent',
    ],
    hint: ['mt-3 font-mono text-meta text-subtle'],
    acctRow: ['mb-2 flex items-center gap-2 border-b border-border pb-3'],
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
    emailForm: ['mt-2 flex flex-col gap-2'],
    emailFormActions: ['flex items-center gap-2'],
    emailHint: ['font-mono text-meta text-danger'],
    emailSent: ['font-mono text-meta text-ok'],
  },
});
