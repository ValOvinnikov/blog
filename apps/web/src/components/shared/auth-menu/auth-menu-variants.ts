import { tv } from 'tailwind-variants';

export const authMenuVariants = tv({
  slots: {
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
    // The session-resolving placeholder — wraps `Spinner` (the live region),
    // not a button, so it's just sized/centered to match the 22×22 footprint
    // of the triggers it stands in for (no border/bg/hover, those are
    // `IconButton`'s interactive-affordance classes and don't apply here).
    statusIndicator: ['inline-grid size-[22px] place-items-center'],
  },
});
