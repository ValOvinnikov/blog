import { tv } from '@platform/utils/tv/tv';

export const railBrandVariants = tv({
  slots: {
    root: ['flex items-center gap-2.5'],
    phoneMark: ['md:hidden'],
    desktopMark: ['hidden md:grid'],
    brandName: ['text-admin-16 font-bold tracking-[0.2px] text-white'],
  },
});
