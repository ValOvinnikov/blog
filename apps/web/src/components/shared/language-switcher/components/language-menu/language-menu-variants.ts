import { tv } from 'tailwind-variants';

export const languageMenuVariants = tv({
  slots: {
    footerTrigger: [
      'inline-flex size-auto items-center gap-1 px-0 py-0.5',
      'font-mono text-meta text-muted',
      'hover:border-transparent hover:bg-transparent hover:text-text',
    ],
    caret: ['size-3'],
    // About six rows before the list scrolls.
    panel: ['max-h-64 w-56 overflow-y-auto'],
    checkSlot: ['inline-flex size-4 shrink-0 items-center justify-center'],
  },
  variants: {
    isInFooter: {
      false: {
        panel: ['right-auto left-0 lg:right-0 lg:left-auto'],
      },
      true: {
        panel: ['top-auto bottom-full mt-0 mb-2'],
      },
    },
  },
});
