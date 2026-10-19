import { tv } from '@blog/ui/lib/styling';

export const themeToggleVariants = tv({
  slots: {
    sun: '',
    moon: '',
  },
  variants: {
    isIconFromThemeClass: {
      true: {
        sun: 'hidden dark:block',
        moon: 'dark:hidden',
      },
    },
  },
});
