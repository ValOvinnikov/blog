import { tv } from 'tailwind-variants';

export const bookmarkButtonVariants = tv({
  slots: {
    root: ['relative inline-flex items-center'],
    // Positioned like `SignInMenu`'s own `errorNotice` (absolute, hanging
    // below the trigger) rather than shifting layout in the meta strip.
    errorNotice: [
      'absolute top-full left-0 z-20 mt-2 min-w-[180px]',
      'rounded-md border border-border bg-surface px-3 py-2 shadow-lg',
      'font-mono text-meta text-danger',
    ],
  },
});
