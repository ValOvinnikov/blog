import { tv } from '@platform/utils/tv/tv';

export const railBrandVariants = tv({
  slots: {
    root: ['flex items-center'],
    phoneMark: ['md:hidden'],
    desktopLogo: ['hidden md:block'],
  },
});
