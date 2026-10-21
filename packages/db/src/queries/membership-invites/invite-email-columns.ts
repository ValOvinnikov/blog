import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import { personalEmailColumns } from '@blog/db/utils/personal-data/personal-data';

export function inviteEmailColumns(email: string): {
  email: string;
} & ReturnType<typeof personalEmailColumns> {
  const normalizedEmail = normalizeEmail(email);
  return { email: normalizedEmail, ...personalEmailColumns(normalizedEmail) };
}
