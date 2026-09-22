import { tv } from 'tailwind-variants';

export const heroProfileAvatarVariants = tv({
  base: ['size-24 rounded-full object-cover sm:size-32'],
});

export const heroProfileAvatarFallbackVariants = tv({
  base: ['size-24 text-2xl sm:size-32 sm:text-3xl'],
});

export const heroProfilePortraitVariants = tv({
  base: ['max-w-80 rounded-xl'],
});

export const heroProfileNameVariants = tv({
  base: ['sr-only'],
});
