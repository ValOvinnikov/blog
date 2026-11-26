import type { TNullable } from '@shinefold/config';
import { hasLength } from '@shinefold/utils/primitives';

/** An empty transform (`@example.com`, a whitespace-only name) falls through rather than rendering blank. */
export const toSessionUsername = (
  name?: TNullable<string>,
  email?: TNullable<string>,
): string => {
  const emailLocalPart = email?.split('@')[0]?.trim() ?? '';
  if (hasLength(emailLocalPart)) {
    return emailLocalPart;
  }

  const slugifiedName = name?.toLowerCase().replace(/\s+/g, '') ?? '';
  if (hasLength(slugifiedName)) {
    return slugifiedName;
  }

  return 'user';
};
