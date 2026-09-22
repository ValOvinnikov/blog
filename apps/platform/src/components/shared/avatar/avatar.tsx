import { avatarVariants, type TAvatarVariants } from './avatar-variants';

export type TAvatarProps = {
  name: string;
  variant: NonNullable<TAvatarVariants['variant']>;
  className?: string;
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '';
  }

  if (words.length === 1) {
    return (words[0] ?? '').slice(0, 2).toUpperCase();
  }

  const first = (words[0] ?? '')[0] ?? '';
  const last = (words[words.length - 1] ?? '')[0] ?? '';

  return `${first}${last}`.toUpperCase();
};

/**
 * Sits beside the name it represents, so the initials it renders are
 * decorative — always `aria-hidden`.
 */
export const Avatar = ({ name, variant, className }: TAvatarProps) => (
  <span
    aria-hidden="true"
    className={avatarVariants({ variant, class: className })}
  >
    {getInitials(name)}
  </span>
);
