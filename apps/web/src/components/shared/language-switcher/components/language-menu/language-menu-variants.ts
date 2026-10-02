import { tv } from 'tailwind-variants';

export const languageMenuVariants = tv({
  slots: {
    trigger: ['shrink-0 gap-1'],
    caret: ['text-[0.7em] leading-none'],
    // About six rows before the list scrolls.
    panel: ['max-h-64 w-56 overflow-y-auto'],
    checkSlot: ['inline-flex size-4 shrink-0 items-center justify-center'],
  },
  variants: {
    trigger: {
      pill: {
        trigger: ['min-h-11 rounded-full lg:min-h-0'],
      },
      globe: {
        trigger: ['rounded-full'],
      },
      text: {
        trigger: [
          'size-auto rounded-sm px-1 py-0.5',
          'font-mono text-meta text-muted',
        ],
      },
    },
    opensUpward: {
      true: {
        panel: ['top-auto bottom-full mt-0 mb-2'],
      },
    },
  },
});
