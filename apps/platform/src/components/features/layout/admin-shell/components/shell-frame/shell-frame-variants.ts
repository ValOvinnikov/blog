import { tv } from '@platform/utils/tv/tv';

export const shellFrameVariants = tv({
  slots: {
    root: ['flex flex-col bg-admin-bg text-admin-text md:flex-row'],
    main: ['flex min-h-0 min-w-0 flex-1 flex-col'],
    content: ['flex-1'],
  },
  variants: {
    // Every ordinary page relies on `root` growing past the viewport and the
    // whole document scrolling, with the sidebar/topbar pinned via
    // `sticky` — the default here. Full-bleed instead caps `root` to
    // exactly the viewport height so `content` gets a definite height to
    // hand down to a child (e.g. embedded Studio) that manages its own
    // internal scrolling.
    isFullBleed: {
      true: {
        root: ['h-dvh overflow-hidden'],
        content: ['min-h-0 overflow-hidden'],
      },
      false: {
        root: ['min-h-dvh'],
        content: ['mx-auto w-full max-w-[1180px] p-4 md:p-[26px]'],
      },
    },
  },
  defaultVariants: {
    isFullBleed: false,
  },
});
