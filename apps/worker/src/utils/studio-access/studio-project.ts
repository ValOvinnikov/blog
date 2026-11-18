import type { TMaybeUndefined } from '@shinefold/config/types';
import { normalizeEmail } from '@shinefold/utils/normalize-email-identity';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

export type TStudioProject = {
  projectId: string;
  token: string;
  env: TProvisionEnv;
};

export function isSameEmail(
  expected: string,
  email: TMaybeUndefined<string>,
): boolean {
  return !!email && normalizeEmail(email) === normalizeEmail(expected);
}
