import { tv } from '@platform/utils/tv/tv';

export const shellFrameVariants = tv({
  slots: {
    root: [
      'flex min-h-dvh flex-col bg-platform-bg text-platform-text md:flex-row',
      '[html:has(&)]:scroll-pt-platform-topbar',
    ],
    main: ['flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip'],
    // Spacing sits on the children, so a streamed notice that renders nothing leaves no gap.
    noticeSlot: [
      'w-full max-w-[1180px] px-4 md:px-platform-content',
      '*:my-4 md:*:mt-platform-content',
    ],
    content: ['flex-1'],
  },
  variants: {
    // Never cap or clip `root` (the document must scroll to keep `Sidebar` reachable); full-bleed pins `main` to the viewport instead.
    isFullBleed: {
      true: {
        main: ['h-dvh overflow-hidden md:sticky md:top-0 md:self-start'],
        content: ['min-h-0 overflow-hidden'],
      },
      false: {
        content: ['w-full max-w-[1180px] p-4 md:p-platform-content'],
      },
    },
  },
  defaultVariants: {
    isFullBleed: false,
  },
});
