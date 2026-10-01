import { tv } from 'tailwind-variants';

export const teamSpotlightVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 gap-8',
      'lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-center lg:gap-12',
    ],
    media: ['mx-auto w-48 overflow-hidden sm:w-64 lg:mx-0 lg:w-full'],
    fallback: ['size-full text-5xl sm:text-6xl'],
    text: ['flex flex-col items-start gap-3 text-left'],
    bio: ['mt-1'],
    social: ['mt-2'],
  },
  variants: {
    isCircle: {
      true: { media: ['rounded-full'] },
      false: { media: ['rounded-xl'] },
    },
  },
});
