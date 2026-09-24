import { tv } from '@blog/ui/lib/styling';

export const toastViewportVariants = tv({
  base: [
    'pointer-events-none fixed z-30',
    'flex flex-col items-end gap-2.5',
    'bottom-[clamp(0.8rem,3vw,1.4rem)] inset-x-[0.8rem]',
    'md:inset-x-auto md:right-[clamp(0.8rem,3vw,1.4rem)] md:w-[min(23rem,calc(100vw-1.6rem))]',
    'pb-[env(safe-area-inset-bottom)]',
  ],
});
