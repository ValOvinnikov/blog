import { tv } from '@blog/ui/lib/styling';

export const languageSwitcherVariants = tv({
  slots: {
    root: ['flex items-center'],
    desktopOnly: ['hidden lg:flex'],
    mobileOnly: ['flex lg:hidden'],
  },
});
