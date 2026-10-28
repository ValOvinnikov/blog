import { uniqueEmailColumns } from '@blog/db/utils/personal-data/personal-data';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';

export function inviteEmailColumns(
  email: string,
): ReturnType<typeof uniqueEmailColumns> {
  return uniqueEmailColumns(normalizeEmail(email));
}
