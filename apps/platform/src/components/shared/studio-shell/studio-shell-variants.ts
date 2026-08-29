import { tv } from '@platform/utils/tv/tv';

export const studioShellVariants = tv({
  slots: {
    // Fixed to the viewport height, not `min-h-dvh` — Studio manages its
    // own internal scrolling, so this must never grow taller than the
    // viewport the way AdminShell's content column does.
    root: ['h-dvh w-full overflow-hidden'],
  },
});
