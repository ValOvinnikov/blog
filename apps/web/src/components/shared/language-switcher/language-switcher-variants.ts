import { tv } from 'tailwind-variants';

export const languageSwitcherVariants = tv({
  slots: {
    root: ['flex items-center'],
    desktopOnly: ['hidden lg:flex'],
    mobileOnly: ['flex lg:hidden'],
  },
});
