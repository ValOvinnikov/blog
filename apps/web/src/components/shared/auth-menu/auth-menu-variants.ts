import { tv } from 'tailwind-variants';

export const authMenuVariants = tv({
  slots: {
    // Reserves the shell's real footprint while its label stays out of
    // sight (`visibility:hidden`, not removed) — matches `ThemeToggle`'s own
    // mounted-placeholder pattern of hiding content, never the shell itself.
    placeholderLabel: ['invisible'],
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
  },
});
