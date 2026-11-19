import { AVATAR_UNKNOWN_INITIAL } from '@platform/constants/avatar';
import type { IWithClassName } from '@shinefold/config/types';
import { hasLength } from '@shinefold/utils/primitives';

import { avatarVariants, type TAvatarVariants } from './avatar-variants';

export type TAvatarProps = IWithClassName & {
  name: string;
  email?: string;
  variant: NonNullable<TAvatarVariants['variant']>;
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!hasLength(words)) {
    return '';
  }

  if (words.length === 1) {
    return (words[0] ?? '').slice(0, 2).toUpperCase();
  }

  const first = (words[0] ?? '')[0] ?? '';
  const last = (words[words.length - 1] ?? '')[0] ?? '';

  return `${first}${last}`.toUpperCase();
};

export const Avatar = ({ name, email, variant, className }: TAvatarProps) => (
  <span
    aria-hidden="true"
    data-testid="avatar"
    className={avatarVariants({ variant, class: className })}
  >
    {getInitials(name) ||
      (email ?? '').charAt(0).toUpperCase() ||
      AVATAR_UNKNOWN_INITIAL}
  </span>
);
