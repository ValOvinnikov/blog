import { saveBarLinkClasses } from '@platform/components/shared/settings-form-shell/components/save-bar/save-bar-variants';
import { tv } from '@platform/utils/tv/tv';

export const phoneSaveFooterVariants = tv({
  slots: {
    root: [
      'fixed inset-x-0 bottom-0 z-20 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 md:hidden',
      'border-t border-platform-line bg-platform-surface text-platform-text',
      'px-4 pt-2.5 pb-[calc(--spacing(2.5)+env(safe-area-inset-bottom))]',
    ],
    status: ['text-platform-13 leading-4 font-semibold'],
    link: [
      ...saveBarLinkClasses,
      'inline-flex min-h-11 items-center text-platform-13 leading-4',
    ],
    save: [
      'ml-auto min-w-29',
      'disabled:border-platform-control-line-locked disabled:bg-platform-pill-neutral disabled:text-platform-muted disabled:shadow-none disabled:opacity-100',
      'aria-busy:border-platform-control-line-locked aria-busy:bg-platform-pill-neutral aria-busy:text-platform-muted aria-busy:shadow-none',
    ],
  },
  variants: {
    hasErrors: {
      true: {
        status: ['basis-full leading-platform-18 text-platform-bad'],
      },
      false: {},
    },
  },
  defaultVariants: {
    hasErrors: false,
  },
});
