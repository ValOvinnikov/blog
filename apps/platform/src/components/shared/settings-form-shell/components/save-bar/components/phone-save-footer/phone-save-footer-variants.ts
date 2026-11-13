import { saveBarLinkClasses } from '@platform/components/shared/settings-form-shell/components/save-bar/save-bar-variants';
import { tv } from '@platform/utils/tv/tv';

export const phoneSaveFooterVariants = tv({
  slots: {
    root: [
      'fixed inset-x-0 bottom-0 z-20 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 md:hidden',
      'border-t border-admin-line bg-admin-surface text-admin-text',
      'px-4 pt-2.5 pb-[calc(--spacing(2.5)+env(safe-area-inset-bottom))]',
    ],
    status: ['text-admin-13 leading-4 font-semibold'],
    link: [
      ...saveBarLinkClasses,
      'inline-flex min-h-11 items-center text-admin-13 leading-4',
    ],
    save: [
      'ml-auto min-w-29',
      'disabled:border-admin-control-line-locked disabled:bg-admin-pill-neutral disabled:text-admin-muted disabled:shadow-none disabled:opacity-100',
      'aria-busy:border-admin-control-line-locked aria-busy:bg-admin-pill-neutral aria-busy:text-admin-muted aria-busy:shadow-none',
    ],
  },
  variants: {
    hasErrors: {
      true: {
        status: ['basis-full leading-admin-18 text-admin-bad'],
      },
      false: {},
    },
  },
  defaultVariants: {
    hasErrors: false,
  },
});
