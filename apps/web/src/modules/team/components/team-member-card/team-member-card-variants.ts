import { tv } from 'tailwind-variants';

export const teamMemberCardVariants = tv({
  slots: {
    role: ['text-sm text-subtle'],
    bio: ['text-prose text-sm text-muted'],
    social: ['mt-auto pt-2'],
  },
});

export const teamMemberCardAvatarFallbackVariants = tv({
  base: ['size-full'],
});
