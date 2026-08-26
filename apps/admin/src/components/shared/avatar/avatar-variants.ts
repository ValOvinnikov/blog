import { tv, type VariantProps } from 'tailwind-variants';

export const avatarVariants = tv({
  base: ['inline-flex shrink-0 items-center justify-center uppercase'],
  variants: {
    variant: {
      table: [
        'size-7.5 rounded-md text-xs font-bold',
        'bg-brand-primary-solid text-brand-primary-contrast',
      ],
      chip: [
        'size-5.5 rounded-full text-xs font-semibold',
        'bg-surface-2 text-text-muted',
      ],
    },
  },
});

export type TAvatarVariants = VariantProps<typeof avatarVariants>;
