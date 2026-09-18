import { tv } from 'tailwind-variants';

export const heroProfileAvatarVariants = tv({
  base: ['size-24 rounded-full object-cover sm:size-32'],
});

export const heroProfileAvatarFallbackVariants = tv({
  base: ['size-24 text-2xl sm:size-32 sm:text-3xl'],
});

export const heroProfileMediaFallbackVariants = tv({
  base: ['flex size-full items-center justify-center bg-surface-2'],
});
