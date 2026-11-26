import { AVATAR_UNKNOWN_INITIAL } from '@platform/constants/avatar';
import type { IWithClassName } from '@shinefold/config/types';
import { hasLength, isUndefined, toInitial } from '@shinefold/utils/primitives';

import { avatarVariants, type TAvatarVariants } from './avatar-variants';

export type TAvatarProps = IWithClassName & {
  name: string;
  email?: string;
  variant: NonNullable<TAvatarVariants['variant']>;
};

const toInitials = (text: string): string[] =>
  Array.from(text).flatMap((char) => toInitial(char) ?? []);

const getInitials = (name: string): string => {
  const words = name
    .split(/\s+/)
    .filter((word) => !isUndefined(toInitial(word)));

  if (!hasLength(words)) {
    return '';
  }

  if (words.length === 1) {
    return toInitials(words[0] ?? '')
      .slice(0, 2)
      .join('');
  }

  const first = toInitial(words[0] ?? '') ?? '';
  const last = toInitial(words[words.length - 1] ?? '') ?? '';

  return `${first}${last}`;
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
