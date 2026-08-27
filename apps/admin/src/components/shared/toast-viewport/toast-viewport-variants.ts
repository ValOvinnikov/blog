import { tv } from '@admin/utils/tv/tv';

export const toastViewportVariants = tv({
  base: [
    'pointer-events-none fixed z-50',
    'flex flex-col items-end gap-[9px]',
    'inset-x-3 bottom-5',
    'md:inset-x-auto md:right-5',
    'max-w-full',
  ],
});
