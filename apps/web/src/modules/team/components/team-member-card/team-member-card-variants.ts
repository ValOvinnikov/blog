import { tv } from 'tailwind-variants';

export const teamMemberCardVariants = tv({
  slots: {
    role: ['text-sm text-subtle'],
    bio: ['text-prose text-sm text-muted'],
  },
});

export const teamMemberCardAvatarFallbackVariants = tv({
  base: ['size-full'],
});
