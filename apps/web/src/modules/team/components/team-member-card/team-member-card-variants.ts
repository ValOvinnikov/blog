import { tv } from 'tailwind-variants';

export const teamMemberCardVariants = tv({
  slots: {
    media: [],
    image: ['size-full object-cover'],
    role: ['text-sm text-subtle'],
    bio: ['text-prose text-sm text-muted'],
  },
  variants: {
    shape: {
      circle: {},
      square: {
        media: [
          'w-48 max-w-[calc(100%-2*var(--spacing-card-x))]',
          'mt-card-y rounded-media',
        ],
      },
    },
    align: {
      left: {},
      center: {},
    },
  },
  compoundVariants: [
    { shape: 'square', align: 'left', class: { media: ['ml-card-x'] } },
    { shape: 'square', align: 'center', class: { media: ['mx-auto'] } },
  ],
});

export const teamMemberCardAvatarFallbackVariants = tv({
  base: ['size-full'],
});
