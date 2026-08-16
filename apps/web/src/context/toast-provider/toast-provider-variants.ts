import { tv } from 'tailwind-variants';

export const toastProviderVariants = tv({
  slots: {
    // `display: contents` — the per-toast hover/focus-within pause/resume
    // wrapper takes part in the DOM tree (so bubbled mouse/focus events and
    // the `Esc`-focus check can target it) without taking part in the box
    // tree, so it never disturbs `ToastViewport`'s flex-column stacking of
    // its `Toast` children.
    row: ['contents'],
  },
});
