import { uniqueEmailColumns } from '@shinefold/db/utils/personal-data/personal-data';
import { normalizeEmail } from '@shinefold/utils/normalize-email-identity';

export function inviteEmailColumns(
  email: string,
): ReturnType<typeof uniqueEmailColumns> {
  return uniqueEmailColumns(normalizeEmail(email));
}
