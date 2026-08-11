import { tv } from 'tailwind-variants';

export const accountMenuVariants = tv({
  slots: {
    // `PopoverMenu`'s own base has no alignment opinion — needed here (but
    // not by every `PopoverMenu` consumer, e.g. `SignInMenu`) because this
    // trigger is a 32px circular `Avatar`, not text/icon content that
    // already centers against its header siblings (`ThemeToggleButton`'s
    // `IconButton`) by default.
    menuRoot: ['flex flex-col items-center'],
    // `size-8` (32px) is `Avatar`'s smallest built-in size (`Size.SM` — no
    // smaller option exists yet) — already the tightest fit around it
    // without cropping the circle; `shrink-0` guards the flex-wrap header row.
    // `border-0` cancels `IconButton`'s own 1px base border, which otherwise
    // shrinks this button's content-box to 30px under `border-box` sizing —
    // `Avatar`'s fixed 32px span then overflows its grid cell ~1px/side,
    // throwing the hover ring (anchored to the button's true edge) off.
    // `border-emphasis`, not `border-strong` — `border-strong` fails WCAG
    // 1.4.11's 3:1 non-text contrast against `--primary` (1.81:1 light /
    // 2.26:1 dark); `border-emphasis` clears it (3.54:1 / 3.94:1) — same fix
    // as `icon-button-variants.ts`.
    avatarTrigger: [
      'size-8 shrink-0 rounded-full border-0',
      'transition-shadow duration-base ease-console',
      'hover:ring-2 hover:ring-border-emphasis hover:ring-offset-2 hover:ring-offset-primary',
    ],
    acctRow: ['mb-2 flex items-center gap-2 border-b border-border pb-3'],
    accountName: ['font-mono text-copy text-text'],
    accountEmail: ['font-mono text-meta text-subtle'],
    signOutItem: ['text-error'],
  },
});
