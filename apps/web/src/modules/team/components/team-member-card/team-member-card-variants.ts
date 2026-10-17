import { tv } from 'tailwind-variants';

export const teamMemberCardVariants = tv({
  slots: {
    root: ['@container/member h-full'],
    card: [],
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
      left: {
        card: ['@min-[30rem]/member:flex-row'],
        media: ['@min-[30rem]/member:self-start @min-[30rem]/member:mb-card-y'],
      },
      center: {},
    },
  },
  compoundVariants: [
    {
      shape: 'square',
      align: 'left',
      class: { media: ['ml-card-x @min-[30rem]/member:shrink-0'] },
    },
    { shape: 'square', align: 'center', class: { media: ['mx-auto'] } },
    {
      shape: 'circle',
      align: 'left',
      class: { media: ['@min-[30rem]/member:mr-0'] },
    },
  ],
});

export const teamMemberCardAvatarFallbackVariants = tv({
  base: ['size-full'],
});
