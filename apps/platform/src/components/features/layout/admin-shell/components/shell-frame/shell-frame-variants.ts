import { tv } from '@platform/utils/tv/tv';

export const shellFrameVariants = tv({
  slots: {
    root: ['flex min-h-dvh flex-col bg-admin-bg text-admin-text md:flex-row'],
    main: ['flex min-h-0 min-w-0 flex-1 flex-col'],
    content: ['flex-1'],
  },
  variants: {
    // `root` always grows past the viewport and lets the whole document
    // scroll, in both modes — that's what keeps `Sidebar` reachable by
    // scroll however many nav rows it holds, at any viewport height or
    // zoom level; it must never be capped or `overflow-hidden`. Full-bleed
    // instead pins `main` itself to the viewport (`h-dvh` + the same
    // `sticky`/`self-start` pattern `Sidebar` already uses), which gives
    // `content` a definite, viewport-sized height to hand down to a child
    // (e.g. embedded Studio) that manages its own internal scrolling.
    isFullBleed: {
      true: {
        main: ['h-dvh overflow-hidden md:sticky md:top-0 md:self-start'],
        content: ['min-h-0 overflow-hidden'],
      },
      false: {
        content: ['mx-auto w-full max-w-[1180px] p-4 md:p-[26px]'],
      },
    },
  },
  defaultVariants: {
    isFullBleed: false,
  },
});
