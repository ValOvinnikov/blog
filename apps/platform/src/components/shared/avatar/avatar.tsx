import { AVATAR_UNKNOWN_INITIAL } from '@platform/constants/avatar';
import type { IWithClassName } from '@shinefold/config/types';
import { isUndefined, toInitial } from '@shinefold/utils/primitives';
import {
  filter,
  first,
  flatMap,
  hasAtLeast,
  join,
  last,
  map,
  pipe,
  take,
} from 'remeda';

import { avatarVariants, type TAvatarVariants } from './avatar-variants';

export type TAvatarProps = IWithClassName & {
  name: string;
  email?: string;
  variant: NonNullable<TAvatarVariants['variant']>;
};

const toLettersAndDigits = (word: string): string[] =>
  flatMap([...word], (char) => toInitial(char) ?? []);

const getInitials = (name: string): string => {
  const words = pipe(
    name.split(/\s+/),
    map(toLettersAndDigits),
    filter(hasAtLeast(1)),
  );
  const firstWord = first(words);
  const lastWord = last(words);

  if (isUndefined(firstWord) || isUndefined(lastWord)) {
    return '';
  }

  if (words.length === 1) {
    return join(take(firstWord, 2), '');
  }

  return `${first(firstWord)}${first(lastWord)}`;
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
