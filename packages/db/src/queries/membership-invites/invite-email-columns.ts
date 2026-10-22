import { personalEmailColumns } from '@blog/db/utils/personal-data/personal-data';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';

export function inviteEmailColumns(email: string): {
  email: string;
} & ReturnType<typeof personalEmailColumns> {
  const normalizedEmail = normalizeEmail(email);
  return { email: normalizedEmail, ...personalEmailColumns(normalizedEmail) };
}
