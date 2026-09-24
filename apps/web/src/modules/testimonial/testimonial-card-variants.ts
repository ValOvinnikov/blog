import { tv } from 'tailwind-variants';

export const testimonialAvatarImageVariants = tv({
  base: ['rounded-full object-cover'],
  variants: {
    isSpotlight: {
      true: ['size-14'],
      false: ['size-10'],
    },
  },
  defaultVariants: { isSpotlight: false },
});
