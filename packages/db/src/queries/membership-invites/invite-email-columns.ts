import { emailColumns } from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';

export function inviteEmailColumns(email: string): {
  email: string;
} & ReturnType<typeof emailColumns> {
  const normalizedEmail = normalizeEmail(email);
  return {
    email: normalizedEmail,
    ...emailColumns(normalizedEmail, personalDataIndex),
  };
}
